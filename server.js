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

    const exercise = new Exercise({
      userId: req.body.userId,
      description: req.body.description,
      duration: req.body.duration,
      date: new Date(req.body.date).toString().substring(0,15) != 'Invalid Date' ? new Date(req.body.date).toString().substring(0,15) : new Date().toString().substring(0,15)
    })
    exercise.save((err, data) => {
      res.json({
        username: user.username,
        description: data.description,
        duration: data.duration,
        "_id": data.userId,
        date: data.date
      });
    })
  } catch(err) {
    res.json({error: "Invalid fields inputted"})
  }
})

app.get('/api/exercise/log', async (req, res) => {
  if(Object.keys(req.query).includes('userId')) {
    try {
      let user = await User.findById(req.query['userId']).select('_id username');
      console.log(user)
      let userExercises = await Exercise.find({userId: req.query['userId']}).select('description duration date')

      res.json({
        _id: user['_id'],
        username: user.username,
        log: [
          {userExercises}
        ],
        count: userExercises.length
      })
    } catch (err) {
      console.log(err)
    }
  } else {
    res.json({error: "User ID is required to view exercise log"});
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
