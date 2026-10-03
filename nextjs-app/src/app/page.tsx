"use client";

import { useState, useEffect } from "react";
import useSocket from '@/hooks/useSocket';
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Globe,
  Shield,
  HeadphonesIcon,
  ChevronDown,
  ChevronUp,
  Send,
  MessageCircle,
  TrendingUp,
  DollarSign,
  Activity,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// trafficData will be loaded from the live /api/ranges endpoint

const faqData = [
  {
    question: "How do I get started with SMS monetization?",
    answer: "Simply register an account, select your preferred country number ranges, integrate via our SMPP or HTTP API, and start earning. We provide comprehensive documentation and 24/7 support to help you get started.",
  },
  {
    question: "What are the payout rates and when do I get paid?",
    answer: "Payout rates vary by destination and range, typically ranging from $0.025 to $0.08 per SMS. Payouts are processed weekly every Tuesday once you reach the minimum threshold of $50.",
  },
  {
    question: "What integration methods do you support?",
    answer: "We support both SMPP 3.4 protocol for high-volume traffic and HTTP API for easier integration. Our technical team provides full integration support and can help you choose the best method for your setup.",
  },
  {
    question: "Are there any setup fees or hidden costs?",
    answer: "No, there are zero setup fees. You only pay for the traffic you route, and we take a transparent commission. All rates are displayed upfront in your dashboard.",
  },
  {
    question: "How many destinations do you support?",
    answer: "We currently support 69+ destinations across Europe, Asia, Africa, and the Americas. Our network is continuously expanding to add new high-value routes.",
  },
];

export default function LandingPage() {
  const [utcTime, setUtcTime] = useState("");
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const socketRef = useSocket('traffic');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    // Listen for realtime traffic events from Socket.IO
    const socket = socketRef.current;
    if (socket) {
      const handler = (payload: any) => {
        const item = {
          country: payload.destination || payload.country || '—',
          prefix: payload.prefix || payload.range || '—',
          range: payload.prefix || '—',
          rate: Number(payload.rate) || 0,
          status: payload.status || 'LIVE',
        };
        setTrafficData((prev) => {
          const next = [item, ...prev];
          return next.slice(0, 50);
        });
      };

      socket.on('traffic:new', handler);
      return () => {
        socket.off('traffic:new', handler);
      };
    }

    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadRanges() {
      try {
        const res = await fetch('/api/ranges');
        if (!res.ok) {
          setTrafficData([]);
          return;
        }
        const json = await res.json().catch(() => null);
        if (!mounted) return;
        const items = Array.isArray(json?.data) ? json.data : [];
        const mapped = items.map((r: any) => ({
          country: r.destination || '—',
          prefix: r.prefix || '—',
          range: r.prefix || '—',
          rate: Number(r.rate) || 0,
          status: r.status || 'LIVE',
        }));
        setTrafficData(mapped);
      } catch (e) {
        // on error, keep empty fallback
        setTrafficData([]);
      }
    }

    loadRanges();
    const int = setInterval(loadRanges, 8000);
    return () => {
      mounted = false;
      clearInterval(int);
    };
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Revo Panel</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition">
                Features
              </a>
              <a href="#rates" className="text-slate-300 hover:text-white transition">
                Rates
              </a>
              <a href="#faq" className="text-slate-300 hover:text-white transition">
                FAQ
              </a>
              <a href="#contact" className="text-slate-300 hover:text-white transition">
                Contact
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-slate-300 hover:text-white transition">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-2 mb-6">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300 text-sm">Server Time (UTC): {utcTime}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Monetize Your{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                SMS Traffic
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8">
              Connect your traffic to 69+ destinations worldwide. Real-time tracking, weekly payouts,
              and zero setup fees. Start earning today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition transform hover:scale-105 flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="text-slate-300 hover:text-white transition px-6 py-3 rounded-lg"
              >
                Login
              </Link>
              <button
                onClick={() => {
                  const el = document.getElementById('rates') || document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition border border-slate-700"
              >
                View Rates
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Traffic Monitor */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Activity className="w-6 h-6 text-blue-400" />
                <span>Live Traffic Monitor</span>
              </h2>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-slate-400 text-sm">Live</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-400 text-sm border-b border-slate-800">
                    <th className="pb-3 font-medium">Country</th>
                    <th className="pb-3 font-medium">Prefix</th>
                    <th className="pb-3 font-medium">Range</th>
                    <th className="pb-3 font-medium">Rate/SMS</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trafficData.map((item, index) => (
                    <tr key={index} className="border-b border-slate-800/50">
                      <td className="py-4 text-white">{item.country}</td>
                      <td className="py-4 text-slate-300">{item.prefix}</td>
                      <td className="py-4 text-slate-300">{item.range}</td>
                      <td className="py-4 text-green-400 font-semibold">${item.rate.toFixed(3)}</td>
                      <td className="py-4">
                        <span
                          className={cn(
                            "inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium",
                            item.status === "delivered"
                              ? "bg-green-500/20 text-green-400"
                              : item.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {item.status === "delivered" && <CheckCircle className="w-3 h-3" />}
                          {item.status === "pending" && <Clock className="w-3 h-3" />}
                          {item.status === "failed" && <XCircle className="w-3 h-3" />}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4-Step Process */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="features">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400 text-lg">Start earning in 4 simple steps</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <Send className="w-8 h-8" />,
                title: "Register",
                description: "Create your account in minutes with email verification",
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "Pick Ranges",
                description: "Select from 69+ country number ranges with competitive rates",
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Route Traffic",
                description: "Connect via SMPP 3.4 or HTTP API and start sending",
              },
              {
                icon: <DollarSign className="w-8 h-8" />,
                title: "Get Paid",
                description: "Receive weekly payouts every Tuesday via your preferred method",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                className="relative"
              >
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur hover:border-blue-500/50 transition">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 text-white">
                    {step.icon}
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/30" id="rates">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose Revo Panel?</h2>
            <p className="text-slate-400 text-lg">Built for performance, designed for growth</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Globe className="w-6 h-6" />,
                title: "69+ Destinations",
                description: "Global coverage across Europe, Asia, Africa, and Americas",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Real-Time Tracking",
                description: "Monitor your traffic and earnings in real-time dashboard",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Zero Setup Fees",
                description: "No hidden costs or upfront payments required",
              },
              {
                icon: <HeadphonesIcon className="w-6 h-6" />,
                title: "24/7 Support",
                description: "Dedicated technical support via WhatsApp and Telegram",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" id="faq">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-lg">Everything you need to know</p>
          </motion.div>
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition"
                >
                  <span className="text-white font-semibold">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-slate-400">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/30" id="contact">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">Get In Touch</h2>
            <p className="text-slate-400 text-lg mb-8">
              Have questions? Our team is available 24/7 to help you get started
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/1234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition flex items-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp</span>
              </a>
              <a
                href="https://t.me/revo_support"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition flex items-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Telegram</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Revo Panel</span>
            </div>
            <p className="text-slate-400 text-sm">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent font-extrabold animate-pulse">© Hani 2026</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
