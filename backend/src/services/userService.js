import mongoose from "mongoose";
import User, { CUSTOMER_TIERS } from "../models/userModel.js";
import { escapeRegex } from "../utils/sanitize.js";

/**
 * Fetch users/customers list with filtering (tier), search, sorting, and pagination
 */
export const getUsersList = async (queryParams = {}) => {
  const {
    search,
    tier,
    sortBy = "newest",
    page = 1,
    limit = 20,
  } = queryParams;

  const filter = {};

  // Tier filter (e.g. VIP, Active, New)
  if (tier && tier !== "all") {
    // Case-insensitive match for tier to handle 'vip', 'active', 'new'
    const matchedTier = CUSTOMER_TIERS.find(
      (t) => t.toLowerCase() === String(tier).toLowerCase()
    );
    if (matchedTier) {
      filter.tier = matchedTier;
    }
  }

  // Search filter across name, email, and location
  if (search && String(search).trim()) {
    const safeRegex = new RegExp(escapeRegex(String(search).trim()), "i");
    filter.$or = [
      { name: safeRegex },
      { email: safeRegex },
      { location: safeRegex },
    ];
  }

  // Sorting
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name_asc: { name: 1 },
    name_desc: { name: -1 },
    spent_desc: { totalSpent: -1 },
    spent_asc: { totalSpent: 1 },
    orders_desc: { ordersCount: -1 },
    orders_asc: { ordersCount: 1 },
  };
  const sortQuery = sortMap[sortBy] || { createdAt: -1 };

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const [users, total] = await Promise.all([
    User.find(filter).sort(sortQuery).skip(skip).limit(parsedLimit),
    User.countDocuments(filter),
  ]);

  // Tab aggregation counts for customer tiers
  const [allCount, vipCount, activeCount, newCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ tier: "VIP" }),
    User.countDocuments({ tier: "Active" }),
    User.countDocuments({ tier: "New" }),
  ]);

  const tierCounts = {
    all: allCount,
    vip: vipCount,
    active: activeCount,
    new: newCount,
  };

  return {
    users,
    total,
    tierCounts,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit) || 1,
    },
  };
};

/**
 * Fetch a single user by ID
 */
export const fetchUserById = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Create a new user account
 */
export const createUserAccount = async (payload = {}) => {
  const { email } = payload;
  if (!email) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existingUser) {
    const error = new Error("A user with this email address already exists");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create(payload);
  return user;
};

/**
 * Update user details
 */
export const updateUserDetails = async (userId, updatePayload = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  // Prevent duplicate email collisions if updating email
  if (updatePayload.email) {
    const normalizedEmail = String(updatePayload.email).toLowerCase().trim();
    const existing = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: userId },
    });
    if (existing) {
      const error = new Error("Another user is already registered with this email");
      error.statusCode = 409;
      throw error;
    }
  }

  // If password is not being updated, exclude it
  if (!updatePayload.password) {
    delete updatePayload.password;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return updatedUser;
};

/**
 * Delete a user
 */
export const removeUserAccount = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  const deletedUser = await User.findByIdAndDelete(userId);
  if (!deletedUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return deletedUser;
};

/**
 * Compute user directory KPI statistics matching frontend Customers view
 */
export const getUserStatsMetrics = async () => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalCustomers, vipPatrons, newThisMonth, spendAggregate] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ tier: "VIP" }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.aggregate([
      { $group: { _id: null, totalSpent: { $sum: "$totalSpent" } } },
    ]),
  ]);

  const totalSpent = spendAggregate[0]?.totalSpent || 0;

  return {
    summaryCards: [
      {
        label: "Total Customers",
        value: totalCustomers.toLocaleString(),
        icon: "group",
      },
      {
        label: "VIP Patrons",
        value: vipPatrons.toLocaleString(),
        icon: "workspace_premium",
      },
      {
        label: "New This Month",
        value: newThisMonth.toLocaleString(),
        icon: "person_add",
      },
    ],
    totalCustomers,
    vipPatrons,
    newThisMonth,
    totalSpent,
  };
};

