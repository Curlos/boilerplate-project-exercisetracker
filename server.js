require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const Exercise = require('./Models/Exercise')
const User = require('./Models/User')

const mongoose = require("mongoose");

const url = process.env.MONGODB_URI;

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

console.log("connecting to", url);

mongoose
	.connect(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true,
	})
	.then(() => {
		console.log("connected to MongoDB");
	})
	.catch((error) => {
		console.log("error connecting to MongoDB:", error.message);
    });

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {
  let user = new User({
    username: req.body.username
  });
  user.save((err, data) => {
    res.json({
      _id: data['_id'],
      username: data.username
    });
  })
})

app.get('/api/exercise/users', async(req, res) => {
  const allUsers = await User.find({}).select('username _id');
  res.json(allUsers);
})

app.post('/api/exercise/add', async(req, res) => {

  try {
    const user = await User.findById(req.body.userId);
    console.log(req.body)

    let d = new Date(new Date(req.body.date).getTime() - new Date(req.body.date).getTimezoneOffset() * -60000)

    const exercise = new Exercise({
      userId: req.body.userId,
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: d.toString().substring(0,15) != 'Invalid Date' ? d.toString().substring(0,15) : new Date().toString().substring(0,15)
    })
    exercise.save((err, data) => {
      res.json({
        username: user.username,
        description: data.description,
        duration: parseInt(data.duration),
        "_id": data.userId,
        date: data.date
      });
    })
  } catch(err) {
    res.json({error: "Invalid fields inputted"})
  }
})

app.get('/api/exercise/log', async (req, res) => {
  try {
    let user = await User.findById(req.query['userId']).select('_id username');
    let userExercises = await Exercise.find({userId: req.query['userId']}).select('description duration date');
    let qFrom = req.query.from;
    let qTo = req.query.to;

    if(qFrom && !qTo) {
      let fromDate = new Date(new Date(req.query['from']).getTime() - new Date(req.query['from']).getTimezoneOffset() * -60000)
      userExercises = userExercises.filter((exercise) => {
        //console.log(`from: ${new Date(exercise.date).getTime()} - ${new Date(fromDate).getTime()}`)
        return (
          new Date(exercise.date).getTime() >= new Date(fromDate).getTime()
        )
      }) 

      userExercises.map((exercise) => {
        console.log(`from: ${new Date(exercise.date).getTime()} - ${new Date(fromDate).getTime()} = ${new Date(exercise.date).getTime() - new Date(fromDate).getTime()}`)
      })
    } else if (!qFrom && qTo) {
      let toDate = new Date(new Date(req.query['to']).getTime() - new Date(req.query['to']).getTimezoneOffset() * -60000) //yyyy-mm-dd date format
      userExercises = userExercises.filter((exercise) => {
        //console.log(`to: ${new Date(exercise.date).getTime()} - ${new Date(toDate).getTime()}`)
        return (
          new Date(exercise.date).getTime() <= new Date(toDate).getTime()
        )
      })

      userExercises.map((exercise) => {
        console.log(`to: ${new Date(exercise.date).getTime()} - ${new Date(toDate).getTime()} = ${new Date(exercise.date).getTime() - new Date(toDate).getTime()}`)
      })
    } else if(qFrom && qTo) {
      userExercises = userExercises.filter((exercise) => {
        //console.log(`to: ${new Date(exercise.date).getTime()} - ${new Date(toDate).getTime()}`)
        let fromDate = new Date(new Date(req.query['from']).getTime() - new Date(req.query['from']).getTimezoneOffset() * -60000)
        let toDate = new Date(new Date(req.query['to']).getTime() - new Date(req.query['to']).getTimezoneOffset() * -60000) 
        return (
          new Date(exercise.date).getTime() >= new Date(fromDate).getTime() && new Date(exercise.date).getTime() <= new Date(toDate).getTime()
        )
      })
    }

    if(Object.keys(req.query).includes('limit')) {
      if(isNaN(req.query['limit']) == false) {
        let amountOfExercises = parseFloat(req.query.limit);
        userExercises = userExercises.slice(0, amountOfExercises);
        console.log(amountOfExercises);
        
      } 
    } 

    res.json({
      _id: user['_id'],
      username: user.username,
      log: [
        {userExercises}
      ],
      count: userExercises.length
    })
  } catch (err) {
    res.send(err)
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
