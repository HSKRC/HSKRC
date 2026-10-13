
/* HSKRC publication email worker.
   Authorized exclusively by vaulted random cron secret; no public sending endpoint. */
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

function json(data: unknown, status=200) {
  return new Response(JSON.stringify(data), {status, headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
}
async function rpc(name: string, body: Record<string, unknown>) {
  const response = await fetch(SUPABASE_URL+"/rest/v1/rpc/"+name, {
    method:"POST",
    headers:{"apikey":SERVICE_KEY,"Authorization":"Bearer "+SERVICE_KEY,"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  if(!response.ok) throw new Error(name+": "+response.status+" "+(await response.text()).slice(0,200));
  const content = await response.text();
  return content ? JSON.parse(content) : null;
}
function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c] ?? c));
}
Deno.serve(async (req: Request) => {
  if(req.method!=="POST") return json({error:"Method not allowed"},405);
  if(!SERVICE_KEY || !SUPABASE_URL) return json({error:"Server unavailable"},503);
  const secret=req.headers.get("x-hskrc-worker-secret")??"";
  if(secret.length<40) return json({error:"Unauthorized"},401);
  try {
    const authorized=await rpc("hskrc_worker_authorized",{p_secret:secret});
    if(authorized!==true) return json({error:"Unauthorized"},401);
    if(!RESEND_KEY) return json({configured:false,reason:"RESEND_API_KEY is not set; no emails sent."},503);
    const jobs=await rpc("hskrc_notification_claim",{p_batch_size:10});
    let sent=0,failed=0;
    for(const job of (Array.isArray(jobs) ? jobs : [])){
      const unsubscribe="https://hskrc.org/unsubscribe.html?token="+encodeURIComponent(job.unsubscribe_token);
      const kind=job.notification_type==="book" ? "Book" : job.notification_type==="article" ? "Article" : "Update";
      const title=String(job.notification_title??"New publication").slice(0,180);
      const url=String(job.notification_url??"");
      if(!url.startsWith("https://hskrc.org/")) {
        await rpc("hskrc_notification_finish",{p_delivery_id:job.delivery_id,p_success:false,p_error:"Invalid publication URL"});
        failed++; continue;
      }
      const safeTitle=esc(title),safeName=esc(job.subscriber_name),safeURL=esc(url),safeUnsub=esc(unsubscribe);
      const html=`<div style="font:16px/1.65 Arial,sans-serif;color:#1b2938;max-width:620px;margin:auto;padding:30px">
        <h2 style="color:#243b55">HSKRC · New ${kind}</h2>
        <p>Hello ${safeName},</p><p>A new ${kind.toLowerCase()} is available at HSKRC:</p>
        <h3>${safeTitle}</h3><p><a href="${safeURL}">View publication</a></p>
        <hr style="border:0;border-top:1px solid #ddd;margin:26px 0">
        <p style="font-size:12px;color:#526070">HSKRC · Hassan Sabbah Knowledge &amp; Research Centre ·
        <a href="https://hskrc.org">hskrc.org</a></p>
        <p style="font-size:12px"><a href="${safeUnsub}">Unsubscribe from publication updates</a></p></div>`;
      const plain=`HSKRC new ${kind}: ${title}\n\nRead: ${url}\n\nHSKRC - https://hskrc.org\nUnsubscribe: ${unsubscribe}`;
      try {
        const response=await fetch("https://api.resend.com/emails",{
          method:"POST",
          headers:{"Authorization":"Bearer "+RESEND_KEY,"Content-Type":"application/json","Idempotency-Key":"hskrc-"+job.delivery_id},
          body:JSON.stringify({
            from:"HSKRC Updates <updates@hskrc.org>",
            to:[job.subscriber_email],
            subject:"HSKRC | New "+kind+": "+title,
            html,text:plain,
            headers:{"List-Unsubscribe":"<"+unsubscribe+">"}
          })
        });
        const result=await response.json().catch(()=>({}));
        if(!response.ok) throw new Error("Resend "+response.status+": "+JSON.stringify(result).slice(0,180));
        await rpc("hskrc_notification_finish",{p_delivery_id:job.delivery_id,p_success:true,p_message_id:result.id??null});
        sent++;
      }catch(e){
        try{await rpc("hskrc_notification_finish",{p_delivery_id:job.delivery_id,p_success:false,p_error:String(e).slice(0,280)})}catch(_){}
        failed++;
      }
    }
    return json({configured:true,processed:sent+failed,sent,failed});
  }catch(e){
    console.error("HSKRC notification worker failed",String(e));
    return json({error:"Worker failed"},500);
  }
});
