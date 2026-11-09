const express=require('express');
const cors=require('cors');
const path=require('path');
const fs=require('fs/promises');
const crypto=require('crypto');
const {protect}=require('./middleware/authMiddleware');
const {wrap,fail}=require('./lib/http');
const app=express();
app.disable('x-powered-by');
app.use(cors({origin:(process.env.CLIENT_URL||'http://localhost:5173').split(',').map(s=>s.trim())}));
app.use(express.json({limit:'8mb'}));
app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');next();});
app.get('/',(req,res)=>res.json({message:'MotorHub API is running'}));
app.get('/api/health',(req,res)=>res.json({status:'ok'}));
const attempts=new Map();
const timer=setInterval(()=>{const now=Date.now();for(const [ip,v] of attempts)if(v.until<now)attempts.delete(ip);},60000);timer.unref();
app.use('/api/auth',(req,res,next)=>{
  if(req.method!=='POST')return next();
  let v=attempts.get(req.ip);if(!v||v.until<Date.now()){v={count:0,until:Date.now()+900000};attempts.set(req.ip,v);}
  if(++v.count>40)return res.status(429).json({message:'Too many sign-in attempts. Try again in 15 minutes'});next();
});
for(const name of ['auth','vehicles'])app.use('/api/'+name,require('./routes/'+(name==='vehicles'?'vehicle':name==='bookings'?'booking':name==='favorites'?'favorite':name)+'Routes'));
const uploadDir=path.join(__dirname,'uploads');
app.use('/uploads',express.static(uploadDir));
app.post('/api/uploads',protect,wrap(async(req,res)=>{
  const data=req.body.data;
  if(typeof data!=='string'||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data))throw fail(400,'Choose a PNG, JPEG or WebP image');
  const bytes=Buffer.from(data.slice(data.indexOf(',')+1),'base64');
  if(bytes.length>5*1024*1024||bytes.length<12)throw fail(400,'Image must be no larger than 5 MB');
  let ext;
  if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='png';
  else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)ext='jpg';
  else if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')ext='webp';
  else throw fail(400,'Unsupported image contents');
  await fs.mkdir(uploadDir,{recursive:true});const name=crypto.randomUUID()+'.'+ext;
  await fs.writeFile(path.join(uploadDir,name),bytes,{flag:'wx'});res.status(201).json({url:'/uploads/'+name});
}));
app.use((req,res)=>res.status(404).json({message:'Endpoint not found'}));
app.use((err,req,res,next)=>{
  let status=err.status||500;
  if(err.name==='ValidationError'||err.name==='CastError')status=400;
  if(err.code===11000)status=409;
  const message=status>=500?'Server error. Please try again.':err.code===11000?'This record already exists':err.message;
  if(status>=500)console.error(err.message);
  res.status(status).json({message});
});
module.exports=app;
