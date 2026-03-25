package pavia;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class Inquiry {

    private static final Map<String, Set<String>> ValidTransitions;
    private static final Set<String> OwnerOnlyTransitions;
    private static final Set<String> AdopterOnlyTransitions;

    static {
        ValidTransitions = new HashMap<>();

        Set<String> fromCreated = new HashSet<>();
        fromCreated.add("Sent");
        ValidTransitions.put("Created", fromCreated);

        Set<String> fromSent = new HashSet<>();
        fromSent.add("Viewed");
        ValidTransitions.put("Sent", fromSent);

        Set<String> fromViewed = new HashSet<>();
        fromViewed.add("InDiscussion");
        ValidTransitions.put("Viewed", fromViewed);

        Set<String> fromInDiscussion = new HashSet<>();
        fromInDiscussion.add("AdoptionPending");
        fromInDiscussion.add("Closed");
        ValidTransitions.put("InDiscussion", fromInDiscussion);

        Set<String> fromAdoptionPending = new HashSet<>();
        fromAdoptionPending.add("Completed");
        ValidTransitions.put("AdoptionPending", fromAdoptionPending);

        ValidTransitions.put("Completed", new HashSet<>());
        ValidTransitions.put("Closed", new HashSet<>());

        OwnerOnlyTransitions = new HashSet<>();
        OwnerOnlyTransitions.add("Viewed");
        OwnerOnlyTransitions.add("InDiscussion");
        OwnerOnlyTransitions.add("Completed");

        AdopterOnlyTransitions = new HashSet<>();
        AdopterOnlyTransitions.add("Sent");
    }

    private static int _nextId = 1;
    private static final List<Inquiry> _store = new ArrayList<>();

    private int inquiryId;
    private String inquiryStatus = "Created";
    private LocalDateTime createdAt;
    private int adopterId;
    private int animalId;
    private int conversationId;

    public Inquiry(int adopterId, int animalId) {
        this.adopterId = adopterId;
        this.animalId  = animalId;
        this.createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public int getInquiryId()        { return inquiryId; }
    public String getInquiryStatus() { return inquiryStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public int getAdopterId()        { return adopterId; }
    public int getAnimalId()         { return animalId; }
    public int getConversationId()   { return conversationId; }

    public InquiryView viewInquiry() {
        Conversation conversation = conversationId > 0 ? Conversation.getById(conversationId) : null;
        List<Message> messages = conversation != null
                ? new ArrayList<>(conversation.getMessages())
                : new ArrayList<>();
        InquiryView view = new InquiryView(this, conversation, messages);

        DateTimeFormatter dtFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        System.out.println("--- Inquiry " + inquiryId + " ---");
        System.out.println("  Status    : " + inquiryStatus);
        System.out.println("  Animal ID : " + animalId);
        System.out.println("  Created   : " + dtFormatter.format(createdAt) + " UTC");

        if (conversation != null) {
            System.out.println("  Conversation " + conversation.getConversationId()
                    + " (" + conversation.getStatus() + ") \u2014 " + messages.size() + " message(s)");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            for (Message msg : messages)
                System.out.println("    [" + timeFormatter.format(msg.getSentAt()) + "] "
                        + msg.getSenderType() + ": " + msg.getContent());
        } else {
            System.out.println("  No conversation thread yet.");
        }

        return view;
    }

    public void updateInquiryStatus(String newStatus, String callerRole) {
        Set<String> allowed = ValidTransitions.get(inquiryStatus);
        if (allowed == null || !allowed.contains(newStatus))
            throw new IllegalStateException(
                    "Invalid inquiry status transition: '" + inquiryStatus + "' \u2192 '" + newStatus + "'.");

        if (callerRole != null) {
            if (OwnerOnlyTransitions.contains(newStatus) && !"owner_shelter".equals(callerRole))
                throw new SecurityException(
                        "Only an owner/shelter can transition an inquiry to '" + newStatus + "'.");
            if (AdopterOnlyTransitions.contains(newStatus) && !"adopter".equals(callerRole))
                throw new SecurityException(
                        "Only an adopter can transition an inquiry to '" + newStatus + "'.");
        }

        inquiryStatus = newStatus;
        System.out.println("Inquiry " + inquiryId + " status updated to '" + inquiryStatus + "'.");
    }

    void linkConversation(int conversationId) {
        this.conversationId = conversationId;
    }

    public static Inquiry getById(int id) {
        return _store.stream().filter(i -> i.inquiryId == id).findFirst().orElse(null);
    }

    public static List<Inquiry> getByAdopter(int adopterId) {
        return _store.stream().filter(i -> i.adopterId == adopterId).collect(Collectors.toList());
    }

    public static List<Inquiry> getByAnimalIds(Iterable<Integer> animalIds) {
        Set<Integer> set = new HashSet<>();
        for (int id : animalIds) set.add(id);
        return _store.stream().filter(i -> set.contains(i.animalId)).collect(Collectors.toList());
    }

    public static Inquiry getByAdopterAndAnimal(int adopterId, int animalId) {
        return _store.stream()
                .filter(i -> i.adopterId == adopterId && i.animalId == animalId)
                .findFirst().orElse(null);
    }

    public static Inquiry add(Inquiry inquiry) {
        inquiry.inquiryId = _nextId++;
        _store.add(inquiry);
        return inquiry;
    }
}
