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
