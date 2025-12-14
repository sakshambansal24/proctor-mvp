import mongoose, { Document, Schema } from 'mongoose';

export interface IRecruiter extends Document {
  name: string;
  email: string;
  password: string; // Hashed password for authentication
  token?: string; // Optional: Legacy passwordless token (deprecated)
  createdAt: Date;
  updatedAt: Date;
}

const RecruiterSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Recruiter name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: function(this: IRecruiter) {
        // Password is required only if token is not provided (new accounts)
        return !this.token;
      },
      minlength: [6, 'Password must be at least 6 characters']
    },
    token: {
      type: String,
      required: false, // Optional: Only required for legacy token-based accounts
      unique: true,
      sparse: true, // Allows multiple null/undefined values - only indexes non-null values
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
RecruiterSchema.index({ email: 1 }, { unique: true });
// Token index: unique with partial filter (allows multiple null/undefined values)
// Only indexes documents where token is a string type
// This allows new password-based accounts to not have a token field
RecruiterSchema.index(
  { token: 1 },
  {
    unique: true,
    partialFilterExpression: { token: { $type: 'string' } }
  }
);

export default mongoose.model<IRecruiter>('Recruiter', RecruiterSchema);

