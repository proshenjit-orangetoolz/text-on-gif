'use strict';

const express = require('express')
const app = express()
const port = 4001

const gifFrames = require('gif-frames');
const GIFEncoder = require('gif-encoder-2');
// const Canvas = require('canvas');
const Events = require('events');
const fs = require('fs');
const fileSystem = require('fs-extra');
// const TextOnGif = require("./controller/encoderController");
const TextOnGif = require("./controller/gifEncoderController");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// const gifController = new TextOnGif({
//     "file_path": "https://media0.giphy.com/media/Ju7l5y9osyymQ/giphy.gif",
//     "font_size": "20px",
//     "font_color": "red",
//     "alignment_y": "right"
// });

const gifController = new TextOnGif();

app.post('/text-on-gif', gifController.initializeTextOnGif)

// app.post('/encoder',gifController.textOnGif)

// app.post('/add-text-to-gif',gifController.textOnGif)



















// app.get('/hello', function (req, res) {
//
//     // Set up canvas
//     const canvasWidth = 320;
//     const canvasHeight = 240;
//     const canvas = createCanvas(canvasWidth, canvasHeight);
//     const ctx = canvas.getContext('2d');
//     const cty = canvas.getContext('2d');
//
//     // Create a new GIFEncoder instance
//     const encoder = new GIFEncoder(canvasWidth, canvasHeight);
//     encoder.createReadStream().pipe(fs.createWriteStream('text_animation.gif'));
//     encoder.start();
//     encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
//     encoder.setDelay(500); // Delay between frames in milliseconds
//     encoder.setQuality(10); // 10 is the default quality
//
//
// // Add frames with text
//     const totalFrames = 10;
//     for (let frame = 0; frame < totalFrames; frame++) {
//         // Clear canvas
//         ctx.clearRect(0, 0, canvasWidth, canvasHeight);
//
//         // Draw text on canvas
//         ctx.fillStyle = '#FFFFFF';
//         ctx.font = 'bold 36px Arial';
//         ctx.textAlign = 'center';
//         ctx.fillText(`Frame ${frame + 1}`, canvasWidth / 2, canvasHeight / 2);
//
//         // Add the current canvas frame to the encoder
//         encoder.addFrame(ctx);
//     }
//
//     // Finish encoding and save the GIF
//     encoder.finish();
//     console.log('GIF created successfully.');
//
//     fileSystem.move(encoder, '/', function (err) {
//         if (err) return console.error(err)
//         console.log('GIF created successfully.')
//     })
//     res.send('GIF created successfully.')
// })
//
// app.get('/combine', function (req, res) {
//     async function combineGIFs() {
//         var gif = new TextOnGif({
//             file_path: "https://media0.giphy.com/media/Ju7l5y9osyymQ/giphy.gif"
//             //path to local file, url or Buffer
//         });
//
//         //get as buffer
//         var buffer = await gif.textOnGif({
//             text: "text on gif sucks",
//             get_as_buffer: true
//         });
//
//         console.log(buffer);
//
//         //write as file
//         await gif.textOnGif({
//             text: "text on gif WOW!!!!",
//             get_as_buffer: false,
//             write_path: "gif-with-text.gif"
//         });
//
//         fileSystem.move(write_path, '/image', function (err) {
//             if (err) return console.error(err)
//             console.log('GIF created successfully.')
//         })
//         res.send('GIF created successfully.')
//     }
//
//     combineGIFs().catch((error) => {
//         console.error('Error combining GIFs:', error);
//
//     });
// })



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})