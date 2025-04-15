// src/services/ReservationEmailService.js
import API from '../api';

/**
 * Service for handling reservation-related email notifications
 */
class ReservationEmailService {
  /**
   * Sends a notification email to the user about their reservation status update
   * 
   * @param {Object} reservation - The reservation object
   * @param {string} status - The new status (APPROVED, REJECTED, etc.)
   * @param {string} [reason] - Optional reason for rejection
   * @returns {Promise<Object>} - Result of the email operation
   */
  async notifyUserAboutStatusUpdate(reservation, status, reason = null) {
    try {
      if (!reservation || !reservation.id || !status) {
        console.error('Invalid parameters for user notification email');
        throw new Error('Missing required parameters');
      }

      // Construct the email data
      const emailData = {
        reservationId: reservation.id,
        status: status,
        reason: reason || ''
      };

      console.log('Sending notification email with data:', emailData);

      // Call the API to send the email
      const response = await API.post('/notifications/reservation-status', emailData);
      
      return response.data;
    } catch (error) {
      console.error('Failed to send user notification email:', error);
      
      // Try fallback method if primary fails
      try {
        // Queue the email for later sending if the API call fails
        await this.queueEmail('user-status-update', {
          reservation,
          status,
          reason
        });
        
        return { queued: true, message: 'Email queued for later sending' };
      } catch (queueError) {
        console.error('Failed to queue email:', queueError);
        throw error; // Re-throw the original error
      }
    }
  }

  /**
   * Sends a notification email to admins about a new reservation request
   * 
   * @param {Object} reservationData - The reservation request data
   * @returns {Promise<Object>} - Result of the email operation
   */
  async notifyAdminAboutNewRequest(reservationData) {
    try {
      if (!reservationData) {
        throw new Error('Reservation data is required');
      }

      console.log('Sending admin notification for new request:', reservationData);

      // Call the API to send the admin notification
      const response = await API.post('/notifications/new-reservation', {
        reservationData
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to send admin notification email:', error);
      
      // Queue the email for later if the API call fails
      try {
        await this.queueEmail('admin-new-request', { reservationData });
        return { queued: true, message: 'Admin notification queued' };
      } catch (queueError) {
        console.error('Failed to queue admin email:', queueError);
        throw error;
      }
    }
  }

  /**
   * Queue an email for later sending (in case of API failure)
   * 
   * @param {string} type - Type of email to queue
   * @param {Object} data - Email data to store
   * @returns {Promise<Object>} - Result of the queue operation
   */
  async queueEmail(type, data) {
    try {
      // Get existing queue from localStorage
      const queuedEmails = JSON.parse(localStorage.getItem('emailQueue') || '[]');
      
      // Add the new email to the queue
      queuedEmails.push({
        type,
        data,
        timestamp: new Date().toISOString(),
        attempts: 0
      });
      
      // Save back to localStorage
      localStorage.setItem('emailQueue', JSON.stringify(queuedEmails));
      
      console.log(`Email of type ${type} queued successfully`);
      return { success: true };
    } catch (error) {
      console.error('Error queueing email:', error);
      throw error;
    }
  }

  /**
   * Process any queued emails that failed to send previously
   * 
   * @returns {Promise<Object>} - Results of the processing
   */
  async processEmailQueue() {
    try {
      // Get the queue
      const queuedEmails = JSON.parse(localStorage.getItem('emailQueue') || '[]');
      
      if (queuedEmails.length === 0) {
        return { success: 0, failed: 0 };
      }
      
      console.log(`Processing ${queuedEmails.length} queued emails`);
      
      let success = 0;
      let failed = 0;
      const updatedQueue = [];
      
      // Process each email in the queue
      for (const email of queuedEmails) {
        try {
          // Max retry attempts
          if (email.attempts >= 3) {
            console.log(`Email ${email.type} exceeded max attempts, removing from queue`);
            failed++;
            continue;
          }
          
          // Increment attempt counter
          email.attempts++;
          
          // Process based on type
          if (email.type === 'user-status-update') {
            await this.notifyUserAboutStatusUpdate(
              email.data.reservation,
              email.data.status,
              email.data.reason
            );
            success++;
          } else if (email.type === 'admin-new-request') {
            await this.notifyAdminAboutNewRequest(email.data.reservationData);
            success++;
          } else {
            console.warn(`Unknown email type in queue: ${email.type}`);
            failed++;
            updatedQueue.push(email); // Keep in queue for manual review
          }
        } catch (error) {
          console.error(`Failed to process queued email ${email.type}:`, error);
          failed++;
          updatedQueue.push(email); // Keep in queue for retry
        }
      }
      
      // Update the queue in localStorage
      localStorage.setItem('emailQueue', JSON.stringify(updatedQueue));
      
      return { success, failed, remaining: updatedQueue.length };
    } catch (error) {
      console.error('Error processing email queue:', error);
      return { success: 0, failed: 0, error: error.message };
    }
  }
}

// Export a singleton instance
export default new ReservationEmailService();