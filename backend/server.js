require('dotenv').config({path:require('path').join(__dirname,'.env')});
const mongoose=require('mongoose');
const app=require('./app');
async function start(){
  if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32||process.env.JWT_SECRET.includes('replace_'))throw new Error('Set JWT_SECRET to a random secret of at least 32 characters');
  await require('./config/db')();
  const server=app.listen(process.env.PORT||5000,()=>console.log('MotorHub API listening on port '+(process.env.PORT||5000)));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await mongoose.disconnect();process.exit(0);}));
  return server;
}
if(require.main===module)start().catch(async err=>{console.error('Startup failed:',err.message);await mongoose.disconnect();process.exitCode=1;});
module.exports={start};
