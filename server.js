//importing
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import MessageDB from './dbSchema/dbMessage.js'
import Pusher from 'pusher'

//App config
const app = express()
const port = process.env.PORT || 9000
const pusher = new Pusher({
    appId: "1098099",
    key: "cc2254540daa48af75e4",
    secret: "ec61d6d6c49945fd4dfc",
    cluster: "us2",
    useTLS: true
});

//DB config
const connection_url = 'mongodb+srv://admin:xqCMMOF5ox8JOFWD@cluster0.ynbkd.mongodb.net/whatsappDB?retryWrites=true&w=majority'
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

mongoose.connection.once('open', () => {
    console.log('DB ok')
    const changeStream = mongoose.connection.collection('conversations').watch()
    changeStream.on('change', (change) => {
        if (change.operationType === 'insert') {
            // console.log(change)
            pusher.trigger('chats', 'newChat', {
                'change': change
            })
        } else if (change.operationType === 'update') {
            // console.log(change)

            pusher.trigger('messages', 'newMessage', {
                'change': change
            })
        } else {
            console.log("Pusher went wrong")
        }
    }
    )
}
)


//MiddleWares
app.use(express.json())
app.use(cors())


//Api routes
app.get('/', (req, res) => {
    res.status(200).send('Hello World')
}
)

app.post('/new/chatname', (req, res) => {
    const chatName = req.body
    MessageDB.create(chatName, (err, data) => {
        if (err) {
            res.status(500).send(err.message)
        } else {
            res.status(201).send(data)
        }
    }
    )
}
)

app.post('/new/message', (req, res) => {
    MessageDB.update(
        { _id: req.query._id },
        {
            $push: {
                conversation: req.body
            }
        }, (err, data) => {
            if (err) {
                res.status(500).send(err)
            } else {
                res.status(201).send(data)
            }
        }
    )
}
)

app.get('/get/allchats', (req, res) => {
    MessageDB.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.get('/get/chatroom', (req, res) => {
    MessageDB.find({ _id: req.query.chatId }, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.get('/get/messagesInfo', (req, res) => {
    MessageDB.find(
        { _id: req.query.chatId },
        (err, datas) => {
            if (err) {
                res.status(500).send(err)
            } else {
                datas.sort((a, b) => {
                    return b.timestamp - a.timestamp
                }
                )
                let messages = [];
                datas.map(data => {
                    const dataInfo = {
                        id: data._id,
                        chatName: data.chatName,
                        lastTimestamp: data.conversation[0].timestamp
                    }
                    messages.push(dataInfo)
                })
                res.status(200).send(messages)
            }
        }
    )
})

app.get('/get/lastMsg', (req, res) => {
    MessageDB.find({ _id: req.query.chatId }, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            let convData = data[0].conversation
            convData.sort((b, a) => {
                return a.timestamp - b.timestamp
            }
            )
            res.status(200).send(convData[0])
        }
    })
}
)

//Listen command
app.listen(port, () => console.log(`Listening on localhost://${port}`))