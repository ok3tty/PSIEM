import ChatBox from "@/components/ChatBox";

const AIAssistant = () => {
  return (
    <div className="px-4 py-6 lg:px-8">
      <h1 className="text-2xl font-semibold mb-2">AI Assistant</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Chat with an AI helper about your security dashboard, data, or anything
        else related to this app.
      </p>

      <ChatBox />
    </div>
  );
};

export default AIAssistant;
