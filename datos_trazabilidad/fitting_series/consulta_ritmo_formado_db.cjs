const API="C:/Users/Asus/Desktop/Trabajo/SistemaTrazabilidad-Elaborados/API";
require(API+"/node_modules/dotenv").config({path:API+"/.env"});
const {Client}=require(API+"/node_modules/pg"); const fs=require("fs");
(async()=>{
 const c=new Client({host:process.env.DB_HOST,port:+process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,connectionTimeoutMillis:8000});
 await c.connect(); await c.query("SET default_transaction_read_only = on");
 const r=await c.query(`select l.fecha::date f, l.datos->>'linea' ln, l.datos->>'sku' sku, (l.datos->>'pallets')::numeric pal, (l.datos->>'tProg')::numeric th, (l.datos->>'paradasMin')::numeric par, s.datos->>'cajasXPallet' cxp, s.datos->>'pesoCaja' pc
  from tablero_datos l left join tablero_datos s on s.entidad='skus' and s.datos->>'sku'=l.datos->>'sku'
  where l.entidad='lineas' and l.fecha>=date '2026-07-01' and l.datos->>'linea' in ('7','8')`);
 fs.writeFileSync(process.argv[2]+"/lineas78.json",JSON.stringify(r.rows)); console.log(r.rows.length);
 await c.end();
})().catch(e=>{console.log("ERR",e.message);process.exit(1)});
