import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronRight, Lock, MessageCircle, Users, Github } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow space-y-12 md:space-y-16">
        <section className="space-y-8 md:space-y-0 flex flex-col md:flex-row md:items-center">
          <div className="md:w-2/3 space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight md:leading-[1.1] max-w-2xl font-light">
              Spread joy this season by getting your loved ones together.
            </h2>
            <p className="text-base md:text-lg text-gray-700 max-w-xl">
              Create private groups, send anonymous messages, and organize your Secret Santa exchange with ease.
            </p>
            <div className="pt-2 md:pt-4">
              <Link href="/groups/create">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full md:w-auto rounded-full text-base px-6 md:px-8 py-3 md:py-4 h-auto border-2 border-black hover:bg-gray-100 transition-colors duration-300 group bg-transparent"
                >
                  Create a Group
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/3 mt-8 md:mt-0">
            <Image
              src="https://res.cloudinary.com/dzmp7xptn/image/upload/v1739155951/6cb6031409e1e48197e84108023d1fee_ghsa3j.jpg"
              alt="Artistic Santa Claus"
              width={400}
              height={500}
              className="w-full h-auto rounded-lg shadow-md"
            />
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6 md:p-8 space-y-4 bg-white/50 border border-black/5">
            <Lock className="h-8 w-8" />
            <h3 className="font-serif text-xl md:text-2xl">Private Groups</h3>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              Create exclusive groups for your family, friends, or colleagues. Only invited members can join.
            </p>
          </Card>

          <Card className="p-6 md:p-8 space-y-4 bg-white/50 border border-black/5">
            <MessageCircle className="h-8 w-8" />
            <h3 className="font-serif text-xl md:text-2xl">Anonymous Messages</h3>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              Exchange messages with your giftee while keeping your identity secret until the reveal.
            </p>
          </Card>

          <Card className="p-6 md:p-8 space-y-4 bg-white/50 border border-black/5">
            <Users className="h-8 w-8" />
            <h3 className="font-serif text-xl md:text-2xl">Group Management</h3>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              Admins can manage members, set budgets, and ensure everyone participates.
            </p>
          </Card>
        </section>
      </div>

      <footer className="mt-12 md:mt-16 py-6 md:py-8 border-t border-black/5">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-gray-700 text-center md:text-left">&copy; {new Date().getFullYear()} xerocopy LLC. All rights reserved.</p>
          <a
            href="https://github.com/yourusername/my-secret-santa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-black transition-colors duration-300"
          >
            <Github className="h-6 w-6" />
          </a>
        </div>
      </footer>
    </div>
  )
}
