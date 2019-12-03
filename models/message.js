const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Chat = require("./chat");

const schema = new Schema(
  {
    // uploads, files
    room: {
      type: String
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
      // autopopulate: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
      // autopopulate: true
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["readed", "unreaded"],
      default: "unreaded",
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// schema.pre("save", async function(next) {
//   if (this.isNew) {
//     await Chat.incMessagesCount(this.msg);
//   }
//   next();
// });

schema.set("toJSON", {
  virtuals: true
});

module.exports = mongoose.model("Message", schema);
