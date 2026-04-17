import React from "react";

const Support = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto space-y-10">

        <div>
          <h1 className="text-3xl font-bold">Help & Support</h1>
          <p className="text-muted-foreground mt-2">
            PSIEM — Security Information & Event Management platform for monitoring,
            threat detection, and system analysis.
          </p>
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Team Members</h2>

          <ul className="space-y-2">
            <li><strong>Farrukh Hayat</strong> — Full Stack Developer</li>
            <li><strong>Muhammad Khurram</strong> — Backend Developer</li>
            <li><strong>Kevin Farokhrouz</strong> — Frontend Developer</li>
            <li><strong>Abdulmuizz Wahab</strong> — Security Engineer</li>
            <li><strong>Jocelyn Bui</strong> — UI/UX Designer</li>
            <li><strong>Ebenezer Belay</strong> — DevOps / Infrastructure</li>
          </ul>
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Project Information</h2>

          <p><strong>University:</strong> University of Texas at Arlington</p>

          <p>
            <strong>GitHub Repository:</strong>{" "}
            <a href="https://github.com/ok3tty/PSIEM" target="_blank" className="text-purple-400 hover:underline">
              https://github.com/ok3tty/PSIEM
            </a>
          </p>
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Contact</h2>

          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:psiemaeg1s@gmail.com" className="text-purple-400 hover:underline">
              psiemaeg1s@gmail.com
            </a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Support;
