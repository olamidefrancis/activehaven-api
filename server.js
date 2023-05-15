
const express= require('express');
var bcrypt = require('bcryptjs');
const app= express();
const bodyParser = require('body-parser');
const cors= require('cors');
const knex = require('knex');

require('dotenv').config();

const PORT = process.env.PORT || 3001


const activedb =knex({
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
      
  
    }
  });
  

 /* activedb.select('*').from('staff').then(data=>{
    console.log(data);
  })*/


app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cors());

const database={
    users:[
        {
            staffemail:'',
            staffname:'',
            id:''
         
        }

    ],

   
 
shiftstart:[
  {

    starttime:'',
    client:'',
    endtime:'',
    hours:'',
    rep1:'',
    rep2:'',
    rep3:'',
    rep4:'',
    rep5:'',
    rep6:''
            

  }
],



    
}


app.get('/',(req ,res)=>{
  res.send("hello")

})

app.post('/signin',(req, res)=>{
const{password,email}= req.body;
  database.users[0].staffemail= email;
 activedb.select('email', 'password').from('login')
 .where('email','=',email)
 .then(data =>{
  const isValid= bcrypt.compareSync(password, data[0].password);
 
  console.log(isValid);
  if(isValid){
    return activedb.select('*').from('staff')
    .where('email','=',email)
    .then(user=>{
      res.status(200).json('go')
     
    })
    .catch(err=>res.status(400).json('unable to get user'))
  }
 })
 .catch(err=>res.status(400).json('wrong credentials'))
})

app.post('/register',(req, res)=>{
    const{password, name,email, sex,age,phone}= req.body;
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
   //  const hashed =  await bcrypt.hash(password,10);
   const hash = bcrypt.hashSync(password,salt);
   activedb.transaction(trx=>{
    trx.insert({
     email: email,
     password:hash
    })
    .into('login')
    .returning('email')
    .then(loginemail=>{
      return trx('staff')
   .returning('*')
   .insert({
    email:loginemail[0].email,
    name:name,
    password:hash,
    tel:phone,
    age: age,
    sex: sex
    
   }).then(staff=>{
    res.json("go")
   })
    })
    .then(trx.commit)
    .catch(trx.rollback)
   })
   
   .catch(err=> res.status(400).json('unable to register'))
     console.log(err)
    
})


app.post('/clients',(req, res)=>{
  const{sponname, sponemail, tel,namew, allergies,age,sex, con1, con2, con3,con4}= req.body;
 
  
  activedb('client')
  .returning('*')
  .insert({
    name:sponname, 
    email:sponemail, 
    tel:tel,
    nameofward:namew, 
    allergies:allergies,
    ageward:age,
    sexward:sex, 
    con1:con1, 
    con2:con2, 
    con3:con3,
    con4:con4
  }).then(response=>{

    res.json(response[0]);
  })

})


app.post('/startshift',(req, res)=>{
  const{client, start}= req.body;
  const check = start;
  database.shiftstart[0].starttime=start;
  database.shiftstart[0].client=client;
  res.json('good')
 console.log( database.users[0].staffemail)
 console.log(check)

 activedb.select('name').from('staff')
         .where('email','=', database.users[0].staffemail)
         .then(resp=>{
          console.log(resp[0].name);
          database.users[0].staffname =resp[0].name;
          
         }).catch(err=>res.status(400).json('unable to get user'))
 //delay for two seconds lest dee if name will reflect
   setTimeout(()=>{
    activedb('shift')
    .returning('*')
    .insert({
      name:database.users[0].staffname, 
      email:database.users[0].staffemail, 
      client:database.shiftstart[0].client,
      starttime: start
    }).then(response=>{
      
      console.log(response[0]);
      database.users[0].id =response[0].id;
    })
    .catch(err=>res.status(400).json('unable to get user'))

   },2000);
})

app.post('/endshift',(req, res)=>{
  const{end,rep1, rep2,rep3, rep4, rep5, staffEmail,client}= req.body;
  console.log(client);
  console.log(staffEmail);
  console.log(end)
  console.log(rep1)
  console.log(rep2)
  const rereg1 =rep1
  const rereg2 =rep2
  const rereg3 =rep3
  const rereg4 =rep4
  const rereg5 =rep5
  
const slq= 
  activedb('shift')
 .where('email','=',staffEmail)
  .where('client','=',client)
  .whereNull('endtime')
  .returning('*')
  .update({
    endtime:end,
   rep1:rereg1,
   rep2:rereg2,
   rep3:rereg3,
   rep4:rereg4,
   rep5:rereg5,
  }).then(resp=>{
    const  {starttime, endtime} =resp[0];
    //need to capture if ni starttime or endtime

    const hours = endtime -starttime;
    console.log(endtime);
    console.log(starttime);
    res.json(hours);
   
    
  }).catch(err=>res.status(400).json('Invalid Shit'))
 
 /* activedb('shift')
  .where('email','=',database.users[0].staffemail)
  .returning('*')
  .update({
    endtime:end
  })
*/
       
  // database.shiftstart[0].endtime=end;
 
 

})



//just to save the ours
app.post('/shifthours',(req, res)=>{
  const{hours, staffEmail,client}= req.body;
  console.log(hours)
  
const slq= 
  activedb('shift')
  .where('email','=',staffEmail)
  .where('client','=',client)
  .whereNull('hours')
  .returning('*')
  .update({
    hours:hours
  }).then(resp=>{
    res.json("today's");
  }).catch(err=>res.status(400).json('Invalid hours'))
 

})






app.listen(process.env.PORT||3001,()=>{
console.log(`app is listening on port ${process.env.PORT}`)
}
 
);

