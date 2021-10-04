const mongoose = require('mongoose');
const { Schema } = mongoose;
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
require('dotenv').config();

app.use('/public', express.static(`${process.cwd()}/public`))
app.get('/', function (req, res) {
	res.sendFile(process.cwd() + '/views/index.html');
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log(`Listening on port ${port}`);
});

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, { useNewUrlParser: true }, (error) => {error && console.error(error)});

const urlSchema = new Schema({
	id: {
		type: Number,
		index: true,
	},
	url: {
		type: String,
		unique: true,
		required: true
	},
})

const urlModel = mongoose.model('Url', urlSchema);

app.post('/api/shorturl', async (req, res) => {
	if (!isUrlValid(req.body.url)) {
		res.json({
			error: "invalid url"
		})
	}
	let existedObj = await urlModel.findOne({url: req.body.url}).exec();
	if (existedObj !== null) {
		res.json({
			original_url: existedObj.url,
			short_url: existedObj.id,
		});
	} else {
		const count = await urlModel.countDocuments();
		let insertedUrl = await urlModel.create({
			id: count + 1,
			url: req.body.url,
		})
		res.json({
			original_url: insertedUrl.url,
			short_url: insertedUrl.id,
		})
	}
})

app.get('/api/shorturl/:id', async (req, res) => {
	let short_url = req.params.id;
	let existedObj = await urlModel.findOne({id: short_url}).exec();
	if (existedObj === null) {
		res.json({
			error: "No short URL found for the given input"
		})
	} else {
		res.redirect(existedObj.url);
	}
})

function isUrlValid(value) {
	return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
  }