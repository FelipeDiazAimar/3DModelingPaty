const API="C:/Users/Asus/Desktop/Trabajo/SistemaTrazabilidad-Elaborados/API";
require(API+"/node_modules/dotenv").config({path:API+"/.env"});
const {Client}=require(API+"/node_modules/pg"); const fs=require("fs");
(async()=>{
 const c=new Client({host:process.env.DB_HOST,port:+process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,connectionTimeoutMillis:8000});
 await c.connect(); await c.query("SET default_transaction_read_only = on");
 const t=await c.query(`select (created_at at time zone 'America/Argentina/Buenos_Aires') ts, cantidad_pallets pal, peso_neto kg from recepcion_camion where cantidad_pallets>0 order by created_at`);
 fs.writeFileSync(process.argv[2]+"/camiones_rc.json",JSON.stringify(t.rows));
 const w=await c.query(`select peso_total::numeric kg from palet where peso_total::numeric between 200 and 1600 and fecha_creacion > now() - interval '240 days'`);
 fs.writeFileSync(process.argv[2]+"/pesos_mp.json",JSON.stringify(w.rows.map(r=>+r.kg)));
 const g=await c.query(`select datos->>'tren' tren, datos->>'turno' turno, fecha::date f, datos->>'hora' hora, datos->>'batch' b from tablero_datos where entidad='grasaBatch' and fecha >= date '2026-07-01' order by 1,3,4`);
 fs.writeFileSync(process.argv[2]+"/grasabatch.json",JSON.stringify(g.rows));
 console.log(t.rows.length,w.rows.length,g.rows.length);
 await c.end();
})().catch(e=>{console.log("ERR",e.message);process.exit(1)});
