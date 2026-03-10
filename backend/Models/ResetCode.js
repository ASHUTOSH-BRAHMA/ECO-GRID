import mongoose from "mongoose"

const { Schema, model } = mongoose;

const ResetCodeSchema = Schema({
    email: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600 // Automatically expire codes after 1 hour
    }
});

const ResetCode = model("ResetCode", ResetCodeSchema);
export default ResetCode;
