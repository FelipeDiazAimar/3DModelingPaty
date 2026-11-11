const API="C:/Users/Asus/Desktop/Trabajo/SistemaTrazabilidad-Elaborados/API";
require(API+"/node_modules/dotenv").config({path:API+"/.env"});
const {Client}=require(API+"/node_modules/pg"); const fs=require("fs");
(async()=>{
 const c=new Client({host:process.env.DB_HOST,port:+process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,connectionTimeoutMillis:8000});
 await c.connect(); await c.query("SET default_transaction_read_only = on");
 const n=await c.query("select count(*) n, min(fecha_creacion) a, max(fecha_creacion) b, count(distinct remito) r from palet");
 console.log(JSON.stringify(n.rows[0]));
 const r=await c.query(`select remito, proveedor, (fecha_creacion at time zone 'America/Argentina/Buenos_Aires')::date d,
   count(*) pallets, min(fecha_creacion at time zone 'America/Argentina/Buenos_Aires') t0, max(fecha_creacion at time zone 'America/Argentina/Buenos_Aires') t1,
   sum(peso_total::numeric) kg, avg(cantidad_cajas_total::numeric) cajas
   from palet where remito is not null and remito<>'' and fecha_creacion > now() - interval '1500 days'
   group by 1,2,3 order by t0`);
 fs.writeFileSync(process.argv[2], JSON.stringify(r.rows));
 console.log("camiones(remito-dia):", r.rows.length);
 await c.end();
})().catch(e=>{console.log("ERR",e.message);process.exit(1)});
