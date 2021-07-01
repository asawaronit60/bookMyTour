const mongoose  = require('mongoose');
const dotenv = require('dotenv')

process.on('uncaughtException', err=>{
    console.log(err.name,err.message)
    console.log("Uncaught Exception shutting down....!")
    process.exit(1);
   })

dotenv.config({path: './config.env'})

 const app  = require('./app')

const DB = process.env.database.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB,{
 useUnifiedTopology:true,
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify : false
})
.then(console.log("DB connection was successfull"))


const port = process.env.PORT || 3000
  const server =  app.listen(port,()=>{
    console.log(`app running on port ${port}`);
})

//TEST

process.on('unhandledRejection',err=>{
    console.log(err.name,err.message)
    console.log("UNHANDLED REJECTION Shutting down....!")
   server.close(()=>{
       process.exit(1);
   })
})


