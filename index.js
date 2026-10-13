const express = require('express')
const app = express()
const port = 8080
const swaggerUi = require('swagger-ui-express')
const yamljs = require('yamljs')
const swaggerDocument = yamljs.load('./docs/swagger.yaml');

app.use(express.json())

const games = [
    {id: 1, name: "Witcher 3", price: 29.99},
    {id: 2, name: "Cyberpunk 2077", price: 59.99},
    {id: 3, name: "Minecraft", price: 26.99},
    {id: 4, name: "Counter-Strike: Global Offensive", price: 0},
    {id: 5, name: "Roblox", price: 0},
    {id: 6, name: "Grand Theft Auto V", price: 29.99},
    {id: 7, name: "Valorant", price: 0},
    {id: 8, name: "Forza Horizon 5", price: 59.99}
]

app.get('/games', (req, res) => {
    res.send(games)
})

app.get('/games/:id', (req, res) => {
    if (typeof games[req.params.id - 1] === 'undefined') {
        return res.status(404).send({error: "Game not found"})
    }

    res.send(games[req.params.id - 1])
})

app.post('/games', (req, res) => {
    const {name, price} = req.body ?? {}
    if (!name || price === undefined || price === null || price === '') {
        return res.status(400).send({error: 'One or all params are missing'})
    }
    let game = {
        id: games.length + 1,
        price: price,
        name: name
    }

    games.push(game)

    res.status(201)
        .location(`${getBaseUrl(req)}/games/${games.length}`)
        .send(game)
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`)
})

function getBaseUrl(req) {
    return (req.socket && req.socket.encrypted ? 'https' : 'http')
        + `://${req.headers.host}`
}
