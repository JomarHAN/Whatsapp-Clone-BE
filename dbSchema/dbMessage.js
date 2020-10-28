import mongoose from 'mongoose'

const whatsappSchema = mongoose.Schema({
    chatName: String,
    conversation: [
        {
            message: String,
            timestamp: String,
            user: {
                uid: String,
                photo: String,
                displayName: String,
                email: String
            }
        }
    ]
})

export default mongoose.model('conversations', whatsappSchema)