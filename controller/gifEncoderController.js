'use strict';
const gifFrames = require('gif-frames');
const GIFEncoder = require('gif-encoder-2');
const Canvas = require('canvas');
const Events = require('events');
const fs = require('fs');
const fileSystem = require('fs-extra');

class TextOnGif extends Events {

    constructor() {
        super();
    }

    async writeMessage({
                           text, get_as_buffer, write_path, retain, width, height,
                           transparent, font_size, font_style, position_x, position_y,
                           alignment_x, alignment_y, offset_x, offset_y, row_gap, retained, stroke_color, stroke_width,
                           font_color, extractedFrames, repeat

                       })
    {
        if (write_path || get_as_buffer) {
            var encoder = new GIFEncoder(width, height, 'neuquant', false, extractedFrames.length);
            if (transparent) {
                encoder.setTransparent(true);
            }
            encoder.setRepeat(repeat);
        }

        const canvas = Canvas.createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.font = font_size + ' ' + font_style;

        if (write_path && !get_as_buffer) {
            const writeStream = fs.createWriteStream(write_path);
            writeStream.on('error', (error) => {
                return Promise.reject(error);
            });
            encoder.createReadStream().pipe(writeStream);
        }

        if (encoder) {
            console.log("========== inside encoder text has or not===========",text);
            encoder.start();
            encoder.on('progress', percent => {
                this.emit("progress", percent);
            });
        }

        const words = text.split(' ');

        const approximateLineHeight = ctx.measureText("M").width;
        const spaceWidth = ctx.measureText("M M").width - (ctx.measureText("M").width * 2);

        var rows = [{text: words[0] + " ", width: ctx.measureText(words[0]).width + spaceWidth}];

        for (var i = 1; i < words.length; i++) {
            var moveToNextRow = rows[rows.length - 1].width + ctx.measureText(words[i]).width + spaceWidth <= width ? 0 : 1;
            rows[rows.length - 1 + moveToNextRow] = {
                text: (rows[rows.length - 1 + moveToNextRow] != null ? rows[rows.length - 1 + moveToNextRow].text : "") + words[i] + " ",
                width: (rows[rows.length - 1 + moveToNextRow] != null ? rows[rows.length - 1 + moveToNextRow].width : 0) + ctx.measureText(words[i]).width + spaceWidth
            };
        }

        if (position_x != null) {
            ctx.textAlign = "start";
            var x = position_x;
        } else {
            if (alignment_x == "right") {
                ctx.textAlign = "right";
                var x = width - offset_x;
            } else if (alignment_x == "left") {
                ctx.textAlign = "left";
                var x = offset_x;
            } else {
                ctx.textAlign = "center";
                var x = width / 2;
            }
        }

        if (position_y != null) {
            ctx.textBaseline = "top";
            var y = position_y;
        } else {
            if (rows.length == 1) {
                if (this.alignment_y == "top") {
                    ctx.textBaseline = "hanging";
                    var y = this.offset_y;
                } else if (this.alignment_y == "middle") {
                    ctx.textBaseline = "middle";
                    var y = height / 2;
                } else {
                    ctx.textBaseline = "bottom";
                    var y = height - this.offset_y;
                }
            } else {
                if (alignment_y == "top") {
                    ctx.textBaseline = "hanging";
                    var y = this.offset_y;
                } else if (alignment_y == "middle") {
                    ctx.textBaseline = "top";
                    var y = (height - ((rows.length * approximateLineHeight) + ((rows.length - 1) * row_gap))) / 2;
                } else {
                    ctx.textBaseline = "bottom";
                    var y = height - (((rows.length - 1) * (approximateLineHeight + row_gap)) + offset_y);
                }
            }
        }

        for (let index = 0; index < extractedFrames.length; index++) {
            this.emit("on frame", index + 1);

            if (!retained) {
                ctx.drawImage(extractedFrames[index].imageData, 0, 0);
            } else {
                ctx.putImageData(extractedFrames[index].imageData, 0, 0);
            }
            console.log("==========retained======extractedFrames.length=========", retained, extractedFrames.length);


            ctx.strokeStyle = stroke_color;
            ctx.lineWidth = stroke_width;
            ctx.font = font_size + ' ' + font_style;
            ctx.fillStyle = font_color;

            if (extractedFrames[index].disposal != 2) {
                var withoutText = ctx.getImageData(0, 0, width, height);
                console.log("========== withoutText image generating ===========", withoutText);
            }

            if (rows.length == 1) {
                ctx.strokeText(text, x, y);
                ctx.fillText(text, x, y);
            } else {
                for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                    ctx.strokeText(rows[rowIndex].text.slice(0, -1), x, (rowIndex * (approximateLineHeight + row_gap)) + y);
                    ctx.fillText(rows[rowIndex].text.slice(0, -1), x, (rowIndex * (approximateLineHeight + row_gap)) + y);
                }
            }

            if (encoder) {
                encoder.setDelay(extractedFrames[index].delay);
                encoder.setDispose(extractedFrames[index].disposal);
                encoder.addFrame(ctx);
            }

            if (retain){
                extractedFrames[index].imageData = ctx.getImageData(0, 0, width, height);
            }

            if (extractedFrames[index].disposal == 2) {
                ctx.clearRect(0, 0, width, height);
            } else {
                ctx.putImageData(withoutText, 0, 0);
            }
        }

        retained = retained ? true : retain;
        if (encoder) encoder.finish();
        this.emit("finished");

        if (get_as_buffer && write_path) {
            await new Promise((resolve, reject) => {
                fs.writeFile(write_path, encoder.out.getData(), error => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            })
        }

        if (get_as_buffer) {
            return Promise.resolve(encoder.out.getData());
            console.log("==========writeMessage step 8 and final===========");
        } else {
            return null;
        }
    }

    async _textOnGif({
                         file_path, extractionComplete, extractedFrames, text, get_as_buffer, write_path, retained, retain,
                         transparent, font_size, font_style, position_x, position_y,
                         alignment_x, alignment_y, offset_x, offset_y, row_gap, stroke_color, stroke_width,
                         font_color, buffer, width, height, noOfFrames, repeat
                     })
    {
        if (extractionComplete) {
            buffer = await this.writeMessage({
                file_path, extractionComplete, extractedFrames, text, get_as_buffer, write_path, retained, retain,
                transparent, font_size, font_style, position_x, position_y,
                alignment_x, alignment_y, offset_x, offset_y, row_gap, stroke_color, stroke_width,
                font_color, buffer, width, height, noOfFrames, repeat
            });
        } else {
            await new Promise((resolve, reject) => {
                this.on('extraction complete', async () => {
                    console.log("==========if extractionComplete false===========");
                    buffer = await this.writeMessage({
                        file_path, extractionComplete, extractedFrames, text, get_as_buffer, write_path, retained, retain,
                        transparent, font_size, font_style, position_x, position_y,
                        alignment_x, alignment_y, offset_x, offset_y, row_gap, stroke_color, stroke_width,
                        font_color, buffer, width, height, noOfFrames, repeat
                    });
                    console.log("======buffer 2nd ==========", buffer);
                    resolve();
                });
            });
        }

        if (buffer) {
            return Promise.resolve(buffer);
        }
    }

    async extractFrames({
                            file_path, extractionComplete, extractedFrames, text, get_as_buffer, write_path, retained ,retain,
                            transparent, font_size, font_style, position_x, position_y,
                            alignment_x, alignment_y, offset_x, offset_y, row_gap, stroke_color, stroke_width,
                            font_color, buffer, repeat
                        }) {
        const frameData = await gifFrames({url: file_path, frames: 'all', outputType: 'png', cumulative: false});
        let width = frameData[0].frameInfo.width;
        let height = frameData[0].frameInfo.height;
        let noOfFrames = frameData.length;

        this.emit('extracted frame info');

        for (let index = 0; index < noOfFrames; index++) {

            await new Promise(async (resolve, reject) => {

                const image = new Canvas.Image();

                image.onload = () => {
                    extractedFrames.push({
                        imageData: image,
                        delay: frameData[index].frameInfo.delay * 10,
                        disposal: frameData[index].frameInfo.disposal
                    });

                    fs.unlink('frame-' + index + '.png', () => {
                    });
                    resolve();
                }

                const writeStream = frameData[index].getImage().pipe(fs.createWriteStream('frame-' + index + '.png'));

                writeStream.on('finish', () => {
                    image.src = 'frame-' + index + '.png';
                    console.log("==========image generating===========", image);
                });

            });

        }

        extractionComplete = true;
        this.emit('extraction complete');
        await this._textOnGif({
            file_path, extractionComplete, extractedFrames, text, get_as_buffer, write_path, retained, retain,
            transparent, font_size, font_style, position_x, position_y,
            alignment_x, alignment_y, offset_x, offset_y, row_gap, stroke_color, stroke_width,
            font_color, buffer, width, height, noOfFrames, repeat
        })
    }


    initializeTextOnGif = async (req, res) => {

        console.log("==================================", req.body);
        let file_path = req.body.file_path;
        let font_size = req.body.font_size;
        let font_style = req.body.font_style ?? "arial";
        let font_color = req.body.font_color ?? "black";
        let stroke_color = req.body.stroke_color ?? "transparent";
        let stroke_width = req.body.stroke_width ?? 1;
        let alignment_x = req.body.alignment_x ?? "center";
        let alignment_y = req.body.alignment_y ?? "bottom";
        let position_x = req.body.position_x;
        let position_y = req.body.position_y;
        let offset_x = req.body.offset_x ?? 10;
        let offset_y = req.body.offset_y ?? 10;
        let row_gap = req.body.row_gap ?? 5;
        let repeat = req.body.repeat ?? 0;
        let transparent = req.body.transparent ?? false;
        let extractedFrames = [];
        let extractionComplete = false;

        // textOnGif req params
        let text = req.body.text ?? "";
        let get_as_buffer = req.body.get_as_buffer ?? true;
        let retain = req.body.retain ?? false;
        let write_path = req.body.write_path;
        let buffer = null;
        let retained = true;


        await this.extractFrames(
            {
                file_path, extractionComplete, extractedFrames, text, get_as_buffer, write_path, retained, retain,
                transparent, font_size, font_style, position_x, position_y,
                alignment_x, alignment_y, offset_x, offset_y, row_gap, stroke_color, stroke_width,
                font_color, buffer, repeat
            })


        res.send("Gif to text converted")
    }
}

module.exports = TextOnGif;