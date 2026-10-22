const express = require('express')
const mongoose = require('mongoose')
const dns = require('dns')
const app = express()
const port = 8080
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gamesdb'
const swaggerUi = require('swagger-ui-express')
const yamljs = require('yamljs')
const swaggerDocument = yamljs.load('./docs/swagger.yaml');

app.use(express.json())

const Game = mongoose.model('Game', new mongoose.Schema({
    name: {type: String, required: true},
    price: {type: Number, required: true}
}, {
    // Send "id" instead of "_id" and hide "__v" in responses
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (doc, ret) => { delete ret._id }
    }
}))

// Inserted only when the games collection is empty
const seedGames = [
    {name: "Witcher 3", price: 29.99},
    {name: "Cyberpunk 2077", price: 59.99},
    {name: "Minecraft", price: 26.99},
    {name: "Counter-Strike: Global Offensive", price: 0},
    {name: "Roblox", price: 0},
    {name: "Grand Theft Auto V", price: 29.99},
    {name: "Valorant", price: 0},
    {name: "Forza Horizon 5", price: 59.99}
]

app.get('/games', async (req, res) => {
    res.send(await Game.find())
})

app.get('/games/:id', async (req, res) => {
    const game = await findGame(req.params.id)

    if (!game) {
        return res.status(404).send({error: "Game not found"})
    }

    res.send(game)
})

app.post('/games', async (req, res) => {
    if (!req.body.name || !req.body.price) {
        return res.status(400).send({ error: 'One or all params are missing' })
    }
    const game = await Game.create({
        price: req.body.price,
        name: req.body.name
    })

    res.status(201)
        .location(`${getBaseUrl(req)}/games/${game.id}`)
        .send(game)
})

app.delete('/games/:id', async (req, res) => {
    const game = await findGame(req.params.id)

    if (!game) {
        return res.status(404).send({error: "Game not found"})
    }

    await game.deleteOne()

    res.status(204).end()
})

app.put('/games/:id', async (req, res) => {
    const game = await findGame(req.params.id)

    if (!game) {
        return res.status(404).send({error: "Game not found"})
    }

    if (!req.body.name || !req.body.price) {
        return res.status(400).send({ error: 'One or all params are missing' })
    }

    game.name = req.body.name
    game.price = req.body.price
    await game.save()

    res.send(game)
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Node on this PC falls back to 127.0.0.1 for DNS, which can't resolve Atlas' mongodb+srv:// address
if (mongoUri.startsWith('mongodb+srv://')) {
    dns.setServers(['8.8.8.8', '1.1.1.1'])
}

mongoose.connect(mongoUri)
    .then(async () => {
        console.log('Connected to MongoDB')

        if (await Game.countDocuments() === 0) {
            await Game.insertMany(seedGames)
            console.log('Added sample games')
        }

        app.listen(port, () => {
            console.log(`API up at: http://localhost:${port}`)
        })
    })
    .catch(err => {
        console.error('Could not connect to MongoDB:', err.message)
        process.exit(1)
    })

// Returns null instead of throwing when the id is not a valid MongoDB ObjectId
async function findGame(id) {
    return mongoose.isValidObjectId(id) ? Game.findById(id) : null
}

function getBaseUrl(req) {
    return req.connection && req.connection.encrypted
        ? 'https' : 'http' + `://${req.headers.host}`
}
