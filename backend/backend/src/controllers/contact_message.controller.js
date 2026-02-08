import { ContactMessage } from "../models/contact_message.model.js";

/**
 * Create a new contact message (public)
 */
const createContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      message
    });

    return res.status(201).json({
      message: "Message sent successfully",
      contactMessage
    });

  } catch (error) {
    console.error("Create contact message error:", error);

    // Mongoose validation error
    if (error.name === "ValidationError") {
        return res.status(400).json({
        message: error.message
        });
    }

    return res.status(500).json({
      message: "Server error"
    });
    
  }
};

/**
 * Get all contact messages (admin)
 */
const getAllContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ created_at: -1 });

    return res.status(200).json({ messages });

  } catch (error) {
    console.error("Get contact messages error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

const updateContactMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    // Normalize input (any case to uppercase)
    if (!status) {
      return res.status(400).json({
        message: "Status is required"
      });
    }

    status = status.toUpperCase();

    // Validate normalized status
    if (!["NEW", "READ", "RESOLVED"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status value"
      });
    }

    const message = await ContactMessage.findById(id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found"
      });
    }

    message.status = status;
    await message.save();

    return res.status(200).json({
      message: "Message status updated",
      contactMessage: message
    });

  } catch (error) {
    console.error("Update contact message error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

/**
 * Delete a contact message (admin)
 */
const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMessage = await ContactMessage.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({
        message: "Message not found"
      });
    }

    return res.status(200).json({
      message: "Message deleted successfully"
    });

  } catch (error) {
    console.error("Delete contact message error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

export {
  createContactMessage,
  getAllContactMessages,
  updateContactMessageStatus,
  deleteContactMessage
};