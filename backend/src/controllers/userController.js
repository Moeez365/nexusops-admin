import asyncHandler from "../utils/asyncHandler.js";
import {
  getUsersList,
  fetchUserById,
  createUserAccount,
  updateUserDetails,
  removeUserAccount,
  getUserStatsMetrics,
} from "../services/userService.js";

/**
 * @desc    Get all users with filtering, search, sorting, and pagination
 * @route   GET /api/users
 * @access  Admin
 */
export const getUsers = asyncHandler(async (req, res) => {
  const result = await getUsersList(req.query);

  return res.status(200).json({
    success: true,
    data: result.users,
    total: result.total,
    tierCounts: result.tierCounts,
    pagination: result.pagination,
  });
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Admin / Authenticated User
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await fetchUserById(req.params.id);

  return res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Create a new user account
 * @route   POST /api/users
 * @access  Admin
 */
export const createUser = asyncHandler(async (req, res) => {
  const newUser = await createUserAccount(req.body);

  return res.status(201).json({
    success: true,
    message: "User account created successfully",
    data: newUser,
  });
});

/**
 * @desc    Update user details
 * @route   PUT /api/users/:id
 * @access  Admin / Authenticated User
 */
export const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await updateUserDetails(req.params.id, req.body);

  return res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
});

/**
 * @desc    Delete a user account
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
export const deleteUser = asyncHandler(async (req, res) => {
  await removeUserAccount(req.params.id);

  return res.status(200).json({
    success: true,
    message: "User account deleted successfully",
  });
});

/**
 * @desc    Get customer/user directory KPI metrics
 * @route   GET /api/users/stats
 * @access  Admin
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await getUserStatsMetrics();

  return res.status(200).json({
    success: true,
    data: stats,
  });
});

