const mongoose=require('mongoose');
module.exports=async()=>{
  if(!process.env.MONGO_URI)throw new Error('Set MONGO_URI in backend/.env (see .env.example)');
  await mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:10000});
  const hello=await mongoose.connection.db.admin().command({hello:1});
  if(!hello.setName&&hello.msg!=='isdbgrid')throw new Error('MotorHub requires MongoDB Atlas or a replica set for safe rental transactions');
  await Promise.all(Object.values(mongoose.models).map(m=>m.init()));
  console.log('MongoDB connected');
};
