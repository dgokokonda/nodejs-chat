const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    // status = public, private
    room: {
      type: String,
      required: true
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    lastMsg: {
      sender: {
        id: {
          type: Schema.Types.ObjectId,
          ref: "User"
        },
        name: {
          type: String
        }
      },
      msg: {
        type: String
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    },
    // msgCount: {
    //   type: Number,
    //   default: 0
    // },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// schema.statics = {
//   incMessagesCount(msgId) {
//     return this.findByIdAndUpdate(
//       msgId,
//       { $inc: { msgCount: 1 } },
//       { new: true }
//     );
//   }
// };

schema.set("toJSON", {
  virtuals: true
});

module.exports = mongoose.model("Chat", schema);
