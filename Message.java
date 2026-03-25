package pavia;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

public class Message {

    private static int _nextId = 1;
    private static final List<Message> _store = new ArrayList<>();

    private int messageId;
    private String content = "";
    private LocalDateTime sentAt;
    private String senderType = "";
    private String deliveryStatus = "pending";
    private int conversationId;

    public int getMessageId()          { return messageId; }
    public String getContent()         { return content; }
    public LocalDateTime getSentAt()   { return sentAt; }
    public String getSenderType()      { return senderType; }
    public String getDeliveryStatus()  { return deliveryStatus; }
    public int getConversationId()     { return conversationId; }

    public void sendMessage(int conversationId, String content, String senderType) {
        validateMessage(content);

        if (!"adopter".equals(senderType) && !"owner_shelter".equals(senderType))
            throw new IllegalArgumentException(
                    "Invalid senderType '" + senderType + "'. Must be 'adopter' or 'owner_shelter'.");

        Conversation conversation = Conversation.getById(conversationId);
        if (conversation == null)
            throw new NoSuchElementException("Conversation " + conversationId + " not found.");

        if ("closed".equals(conversation.getStatus()))
            throw new IllegalStateException(
                    "Cannot send a message to closed conversation " + conversationId + ".");

        this.messageId      = _nextId++;
        this.content        = content;
        this.sentAt         = LocalDateTime.now(ZoneOffset.UTC);
        this.senderType     = senderType;
        this.conversationId = conversationId;
        this.deliveryStatus = "pending";

        try {
            conversation.getMessages().add(this);
            _store.add(this);
            this.deliveryStatus = "delivered";
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            System.out.println("[Message " + messageId + "] Delivered to conversation " + conversationId
                    + " (" + this.senderType + " \u2014 " + timeFormatter.format(sentAt) + " UTC).");
        } catch (Exception ex) {
            this.deliveryStatus = "failed";
            System.out.println("[Message " + messageId + "] Delivery failed: " + ex.getMessage() + ". Please try again.");
            throw ex;
        }

        advanceInquiry(conversation, senderType);
    }

    public void validateMessage(String content) {
        if (content == null || content.trim().isEmpty())
            throw new IllegalArgumentException("Message content cannot be empty. Please enter a message before sending.");
    }

    public static Message getById(int id) {
        return _store.stream().filter(m -> m.messageId == id).findFirst().orElse(null);
    }

    public static List<Message> getByConversation(int conversationId) {
        return _store.stream()
                .filter(m -> m.conversationId == conversationId)
                .sorted(Comparator.comparing(Message::getSentAt))
                .collect(Collectors.toList());
    }

    private static void advanceInquiry(Conversation conversation, String senderType) {
        Inquiry inquiry = Inquiry.getById(conversation.getInquiryId());
        if (inquiry == null) return;

        String status = inquiry.getInquiryStatus();
        if ("Sent".equals(status) && "owner_shelter".equals(senderType)) {
            inquiry.updateInquiryStatus("Viewed",       "owner_shelter");
            inquiry.updateInquiryStatus("InDiscussion", "owner_shelter");
        } else if ("Viewed".equals(status) && "owner_shelter".equals(senderType)) {
            inquiry.updateInquiryStatus("InDiscussion", "owner_shelter");
        }
    }
}
