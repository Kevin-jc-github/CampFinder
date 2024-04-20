const mongoose = require('mongoose');
<<<<<<< HEAD
const express = require('express');
=======
>>>>>>> ebf3e3b (add map, change styling)
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp');

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];


const seedDB = async () =>{
    await Campground.deleteMany({});
<<<<<<< HEAD
    for(let i = 0; i < 50; i++){
=======
    for(let i = 0; i < 300; i++){
>>>>>>> ebf3e3b (add map, change styling)
        const random1000 = Math.floor(Math.random() * 1000);
        const price =  Math.floor(Math.random()*20 + 10);
        const camp = new Campground({
            author: '662203eb0580ec5b7854401c',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
<<<<<<< HEAD
            image: 'https://source.unsplash.com/collection/483251',
            description:'ipsum dolor sit amet consectetur adipisicing elit. Sunt itaque accusamus cumque assumenda, iusto laboriosam eaque dicta ducimus delectus. Dignissimos aperiam molestiae sed, eum natus reprehenderit tenetur dolore earum eveniet!',
            price
=======
            description:'ipsum dolor sit amet consectetur adipisicing elit. Sunt itaque accusamus cumque assumenda, iusto laboriosam eaque dicta ducimus delectus. Dignissimos aperiam molestiae sed, eum natus reprehenderit tenetur dolore earum eveniet!',
            price,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            images: [{
                url: 'https://res.cloudinary.com/dppmzond5/image/upload/v1713560938/YelpCamp/ewhkijvrur5p1cacijtk.jpg',
                filename: 'YelpCamp/ewhkijvrur5p1cacijtk'
            }]
>>>>>>> ebf3e3b (add map, change styling)
        });
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})