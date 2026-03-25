package pavia;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class Conversation {

    private static int _nextId = 1;
    private static final List<Conversation> _store = new ArrayList<>();

    private int conversationId;
    private LocalDateTime createdAt;
    private String status = "active";
    private List<Message> messages = new ArrayList<>();
    private int adopterId;
    private int animalId;
    private int inquiryId;

    private Conversation(int adopterId, int animalId) {
        this.adopterId = adopterId;
        this.animalId  = animalId;
        this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public int getConversationId()      { return conversationId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getStatus()           { return status; }
    public List<Message> getMessages()  { return messages; }
    public int getAdopterId()           { return adopterId; }
    public int getAnimalId()            { return animalId; }
    public int getInquiryId()           { return inquiryId; }

    public static Conversation startConversation(Adopter adopter, AnimalProfile animal, String firstMessageContent) {
        Conversation existing = _store.stream()
                .filter(c -> c.adopterId == adopter.getUserId() && c.animalId == animal.getAnimalId())
                .findFirst().orElse(null);

        if (existing != null) {
            System.out.println("Existing conversation thread found (ID: " + existing.conversationId + "). Appending message to it.");
            Message appendMsg = new Message();
            appendMsg.sendMessage(existing.conversationId, firstMessageContent, "adopter");
            Inquiry existingInquiry = Inquiry.getById(existing.inquiryId);
            if (existingInquiry != null && "Viewed".equals(existingInquiry.getInquiryStatus()))
                existingInquiry.updateInquiryStatus("InDiscussion", "adopter");
            return existing;
        }

        Conversation conv = new Conversation(adopter.getUserId(), animal.getAnimalId());
        conv.conversationId = _nextId++;
        _store.add(conv);

        Inquiry inquiry = Inquiry.add(new Inquiry(adopter.getUserId(), animal.getAnimalId()));
        conv.inquiryId = inquiry.getInquiryId();
        inquiry.linkConversation(conv.conversationId);
        inquiry.updateInquiryStatus("Sent", "adopter");

        Message msg = new Message();
        msg.sendMessage(conv.conversationId, firstMessageContent, "adopter");

        System.out.println("Conversation " + conv.conversationId + " started for animal '" + animal.getName() + "' (Inquiry " + inquiry.getInquiryId() + ").");
        return conv;
    }

    public static Conversation getOrCreate(Adopter adopter, AnimalProfile animal) {
        Conversation existing = _store.stream()
                .filter(c -> c.adopterId == adopter.getUserId() && c.animalId == animal.getAnimalId())
                .findFirst().orElse(null);
        if (existing != null) return existing;

        Conversation conv = new Conversation(adopter.getUserId(), animal.getAnimalId());
        conv.conversationId = _nextId++;
        _store.add(conv);

        Inquiry inquiry = Inquiry.add(new Inquiry(adopter.getUserId(), animal.getAnimalId()));
        conv.inquiryId = inquiry.getInquiryId();
        inquiry.linkConversation(conv.conversationId);

        return conv;
    }

    public List<Message> viewConversation() {
        List<Message> ordered = messages.stream()
                .sorted(Comparator.comparing(Message::getSentAt))
                .collect(Collectors.toList());
        AnimalProfile animal = AnimalProfile.getById(animalId);
        String animalName = animal != null ? animal.getName() : "Animal #" + animalId;
        System.out.println("\u2500\u2500\u2500 Conversation " + conversationId + " \u2014 " + animalName + " (" + status + ") \u2500\u2500\u2500");
        if (ordered.isEmpty()) {
            System.out.println("  (no messages yet)");
        } else {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            for (Message msg : ordered)
                System.out.printf("  [%s UTC] %-14s: %s%n",
                        formatter.format(msg.getSentAt()), msg.getSenderType(), msg.getContent());
        }
        return ordered;
    }

    public void closeConversation() {
        if ("closed".equals(status)) {
            System.out.println("Conversation " + conversationId + " is already closed.");
            return;
        }
        status = "closed";
        Inquiry inquiry = Inquiry.getById(inquiryId);
        if (inquiry != null && "InDiscussion".equals(inquiry.getInquiryStatus()))
            inquiry.updateInquiryStatus("Closed", null);
        System.out.println("Conversation " + conversationId + " closed.");
    }

    public static Conversation getById(int id) {
        return _store.stream().filter(c -> c.conversationId == id).findFirst().orElse(null);
    }

    public static List<Conversation> getByAdopter(int adopterId) {
        return _store.stream().filter(c -> c.adopterId == adopterId).collect(Collectors.toList());
    }
}
