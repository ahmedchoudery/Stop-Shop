import { withRoute, ApiError } from '@/lib/api/withRoute';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Customer from '@/models/Customer';
import { CUSTOMER_JWT_SECRET } from '@/lib/adminAuth';
import { loginSchema } from '@/schemas/validation';

export const POST = withRoute({
  requiredRole: 'public',
  schema: {
    body: loginSchema
  },
  handler: async ({ body }) => {
    const { email, password } = body;

    const customer = await Customer.findOne({ email });
    if (!customer) {
      throw new ApiError('UNAUTHENTICATED', 'No account found with this email', 401);
    }

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) {
      throw new ApiError('UNAUTHENTICATED', 'Incorrect password', 401);
    }

    const token = jwt.sign(
      { id: customer._id.toString(), email: customer.email, type: 'customer' },
      CUSTOMER_JWT_SECRET,
      { expiresIn: '30d' }
    );

    const safeCustomer = customer.toObject();
    delete safeCustomer.password;
    if (safeCustomer._id) {
      safeCustomer._id = safeCustomer._id.toString();
    }

    return { token, customer: safeCustomer };
  }
});
