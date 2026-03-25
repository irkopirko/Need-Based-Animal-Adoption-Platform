package pavia;

import java.util.List;

public class InquiryView {

    private final Inquiry inquiry;
    private final Conversation conversation;
    private final List<Message> messages;

    public InquiryView(Inquiry inquiry, Conversation conversation, List<Message> messages) {
        this.inquiry      = inquiry;
        this.conversation = conversation;
        this.messages     = messages;
    }

    public Inquiry getInquiry()           { return inquiry; }
    public Conversation getConversation() { return conversation; }
    public List<Message> getMessages()    { return messages; }
}
