const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    // status = public, private
    room: {
      type: Number,
      required: true
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
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

schema.set("toJSON", {
  virtuals: true
});

module.exports = mongoose.model("Chat", schema);
