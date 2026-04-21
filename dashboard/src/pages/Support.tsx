import { Users, BookOpen, Mail, Github } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const TEAM_MEMBERS = [
  { name: 'Farrukh Hayat',     role: 'Full Stack Developer' },
  { name: 'Muhammad Khurram',  role: 'Backend Developer' },
  { name: 'Kevin Farokhrouz', role: 'Frontend Developer' },
  { name: 'Abdulmuizz Wahab',  role: 'Security Engineer' },
  { name: 'Jocelyn Bui',       role: 'UI/UX Designer' },
  { name: 'Ebenezer Belay',    role: 'DevOps / Infrastructure' },
];

export default function Support() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground mt-1">
          PSIEM — Security Information & Event Management platform for monitoring, threat detection, and system analysis.
        </p>
      </div>

      {/* Team Members */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </CardTitle>
          <CardDescription>The people behind PSIEM</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {TEAM_MEMBERS.map((member) => (
              <li key={member.name} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                <span className="font-semibold">{member.name}</span>
                <span className="text-sm text-muted-foreground">{member.role}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Project Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Project Information
          </CardTitle>
          <CardDescription>Academic and repository details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border">
            <p className="text-sm text-muted-foreground">University</p>
            <p className="font-semibold mt-1">University of Texas at Arlington</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">GitHub Repository</p>
              <p className="font-semibold mt-1">ok3tty/PSIEM</p>
            </div>
            <a
              href="https://github.com/ok3tty/PSIEM"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-colors"
            >
              <Github className="w-4 h-4" />
              View Repo →
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact
          </CardTitle>
          <CardDescription>Get in touch with the team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-lg bg-background/50 border border-border flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold mt-1">psiemaeg1s@gmail.com</p>
            </div>
            <a
              href="mailto:psiemaeg1s@gmail.com"
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-colors"
            >
              <Mail className="w-4 h-4" />
              Send Email →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
