const sizeOf = require('image-size');

const { connectToDB } = require('./lib/mongo');
const { connectToRabbitMQ, getChannel } = require('./lib/rabbitmq');
const { getDownloadStreamById, updateImageDimensionsById, getImageInfoById, linkImageByID, getDimensionArray} = require('./models/image');

connectToDB(async () => {
  await connectToRabbitMQ('images');
  const channel = getChannel();
  channel.consume('images', msg => {
    const id = msg.content.toString();
    const imageChunks = [];
    getDownloadStreamById(id)
      .on('data', chunk => {
        imageChunks.push(chunk);
      })
      .on('end', async () => {
        const dimensions = sizeOf(Buffer.concat(imageChunks));
        const dimArr = await getDimensionArray(dimensions["height"]);
        const info = await getImageInfoById(id);
        const typeTest = info.filename;
        if(typeTest.includes(".png")){
          dimArr.push("orig");
        }
        var result;
        var urls = {};

        for (let i = 0; i < dimArr.length; i++) {
          if(dimArr[i] != "orig"){
            result = await updateImageDimensionsById(dimArr[i], Buffer.concat(imageChunks), info, i, dimArr);
          }
          else if(dimArr[i] == "orig"){
            result = await updateImageDimensionsById(dimensions["height"], Buffer.concat(imageChunks), info, i, dimArr);
          }
        }
        for (let i = 0; i < dimArr.length; i++) {   
          var item = dimArr[i];   
          var name = item.toString();
          urls[name] = `/media/photos/${result[name]}`
        }
        const photoData = await linkImageByID(id, urls, result)

      });
    channel.ack(msg);
  });
});