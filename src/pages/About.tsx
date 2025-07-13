import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Shield,
  Clock,
  QrCode,
  Layers,
  Users,
  Building,
  User,
  ChevronRight,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const About = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
      <Navbar />

      {/* Hero Section with Animated Background */}
      <div className="relative min-h-screen flex items-center pt-16 md:pt-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900">
        {/* Animated background pulses */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-purple-600/10 dark:bg-purple-600/20"
              initial={{ scale: 0, x: '50%', y: '50%' }}
              animate={{
                scale: [0, 15],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                delay: i * 2,
                ease: "easeOut"
              }}
              style={{
                left: `${30 + Math.random() * 40}%`,
                top: `${30 + Math.random() * 40}%`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-5xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="mb-6 flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="relative">
                <Zap size={48} className="text-purple-600 dark:text-purple-500" />
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.7, 0, 0.7]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap size={48} className="text-purple-600 dark:text-purple-500" />
                </motion.div>
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              About Pulse
            </motion.h1>

            <motion.p
              className="text-lg md:text-2xl mb-10 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              Pulse is a next-generation ticketing platform launched in 2025 with one goal in mind:
              <motion.span
                className="inline-block font-semibold text-gray-900 dark:text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                redefining how people access and experience events
              </motion.span>.
              From music festivals and sports games to conferences and local gatherings,
              Pulse makes discovering and securing tickets seamless, secure, and enjoyable.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 h-auto font-medium rounded-full group shadow-lg hover:shadow-xl transition-all duration-300"
                asChild
              >
                <Link to="/events">
                  Explore Events
                  <motion.span
                    className="inline-block ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.span>
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{
            y: [0, 10, 0],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronRight size={24} className="rotate-90 text-gray-600 dark:text-gray-400" />
        </motion.div>
      </div>

      {/* Why Pulse Section */}
      <motion.div
        className="bg-gradient-to-b from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.div className="max-w-4xl mx-auto" variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-900 dark:text-white">Why Pulse?</h2>

            <div className="relative bg-white/80 dark:bg-black/40 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10"
                animate={{
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 leading-relaxed relative z-10">
                We noticed the ticketing world was stuck — plagued by clunky systems, hidden fees, and poor user experiences.
                Pulse was born to change that. With a <span className="font-semibold text-purple-700 dark:text-purple-300">clean, mobile-first interface</span>,
                <span className="font-semibold text-pink-700 dark:text-pink-300"> transparent pricing</span>, and
                <span className="font-semibold text-blue-700 dark:text-blue-300"> instant digital ticket delivery</span>,
                we're bringing simplicity and trust back to event access.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Our Mission Section */}
      <motion.div
        className="bg-white dark:bg-gray-900 py-16 relative overflow-hidden border-y border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-purple-300 dark:via-purple-500 to-transparent w-full"
              style={{ top: `${20 + i * 20}%` }}
              animate={{
                x: ['-100%', '100%'],
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                delay: i * 2,
                ease: "linear"
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-10 text-gray-900 dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Our Mission
            </motion.h2>

            <motion.p
              className="text-xl md:text-2xl font-light italic text-gray-700 dark:text-gray-300"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              To empower event organizers and attendees with tools that make ticketing
              <span className="relative inline-block mx-2">
                <span className="relative z-10 text-purple-700 dark:text-purple-300 font-medium">faster,</span>
                <motion.span
                  className="absolute bottom-1 left-0 h-2 bg-purple-200 dark:bg-purple-500/30 w-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1 }}
                />
              </span>
              <span className="relative inline-block mx-2">
                <span className="relative z-10 text-pink-700 dark:text-pink-300 font-medium">fairer,</span>
                <motion.span
                  className="absolute bottom-1 left-0 h-2 bg-pink-200 dark:bg-pink-500/30 w-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                />
              </span>
              and
              <span className="relative inline-block mx-2">
                <span className="relative z-10 text-blue-700 dark:text-blue-300 font-medium">more human.</span>
                <motion.span
                  className="absolute bottom-1 left-0 h-2 bg-blue-200 dark:bg-blue-500/30 w-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                />
              </span>
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Built for 2025 Section */}
      <motion.div
        className="bg-gradient-to-b from-purple-50 to-gray-50 dark:from-purple-900 dark:to-gray-900 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-4">
          <motion.div className="max-w-5xl mx-auto" variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-900 dark:text-white">Built for 2025 and Beyond</h2>

            <p className="text-lg md:text-xl text-center text-gray-700 dark:text-gray-300 mb-12">
              Pulse is built on modern technology, ensuring:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Clock className="h-8 w-8" />,
                  title: "Real-time ticket availability",
                  description: "Never miss out on events with live inventory updates and waitlist notifications.",
                  color: "from-purple-600 to-indigo-600",
                  lightBg: "bg-purple-50 dark:bg-purple-900/20"
                },
                {
                  icon: <QrCode className="h-8 w-8" />,
                  title: "Secure QR code entry",
                  description: "Encrypted, tamper-proof digital tickets with animated verification.",
                  color: "from-pink-600 to-red-600",
                  lightBg: "bg-pink-50 dark:bg-pink-900/20"
                },
                {
                  icon: <Layers className="h-8 w-8" />,
                  title: "Easy integration",
                  description: "Seamless API connections for promoters and venues of any size.",
                  color: "from-blue-600 to-cyan-600",
                  lightBg: "bg-blue-50 dark:bg-blue-900/20"
                },
                {
                  icon: <Shield className="h-8 w-8" />,
                  title: "Fraud protection",
                  description: "Smart verification tools that keep tickets in the right hands.",
                  color: "from-green-600 to-emerald-600",
                  lightBg: "bg-green-50 dark:bg-green-900/20"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className={`relative rounded-xl overflow-hidden group border border-gray-200/50 dark:border-gray-700/50 ${feature.lightBg}`}
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/40 dark:from-black/20 dark:to-black/40 backdrop-blur-sm" />

                  <div className="p-6 relative z-10">
                    <div className={`bg-gradient-to-r ${feature.color} text-white rounded-full p-3 inline-flex mb-4`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-gray-700 dark:text-gray-300">{feature.description}</p>

                    <motion.div
                      className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.color} w-0`}
                      initial={{ width: '0%' }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Who We Serve Section */}
      <motion.div
        className="bg-white dark:bg-gray-900 py-16 relative overflow-hidden border-y border-gray-200 dark:border-gray-700"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-purple-100 dark:bg-purple-500/10 h-20 w-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div className="max-w-4xl mx-auto" variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-900 dark:text-white">Who We Serve</h2>

            <p className="text-lg md:text-xl text-center text-gray-700 dark:text-gray-300 mb-12">
              Whether you're hosting a stadium show or a startup pitch night, Pulse gives you everything you need:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                {
                  icon: <Building className="h-10 w-10 text-purple-600 dark:text-purple-500" />,
                  title: "Organizers",
                  features: [
                    "Intuitive management dashboards",
                    "Powerful promotion tools",
                    "Real-time analytics & insights",
                    "Flexible pricing models"
                  ]
                },
                {
                  icon: <User className="h-10 w-10 text-pink-600 dark:text-pink-500" />,
                  title: "Attendees",
                  features: [
                    "Stress-free ticket purchasing",
                    "Personalized event discovery",
                    "Secure mobile tickets",
                    "Seamless venue check-in"
                  ]
                }
              ].map((group, index) => (
                <motion.div
                  key={index}
                  className="relative bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
                  variants={itemVariants}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      {group.icon}
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0, 0.5]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        {group.icon}
                      </motion.div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{group.title}</h3>
                  </div>

                  <ul className="space-y-3">
                    {group.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        className="flex items-center gap-3 text-base md:text-lg text-gray-700 dark:text-gray-300"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                      >
                        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500" />
                        {feature}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Join the Pulse CTA */}
      <motion.div
        className="bg-gradient-to-b from-gray-50 to-purple-100 dark:from-gray-900 dark:to-purple-900 py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Join the Pulse
            </motion.h2>

            <motion.p
              className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              We're growing fast and constantly improving. Join thousands of users already pulsing with the beat of a better ticketing experience.
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 h-auto font-medium rounded-full relative overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center">
                    Create Your Account
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '0%' }}
                    transition={{ duration: 0.4 }}
                  />
                </Button>
              </Link>

              <Link to="/events">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-500 dark:text-purple-500 dark:hover:bg-purple-500/20 px-8 py-6 h-auto font-medium rounded-full transition-all duration-300"
                >
                  Explore Events
                </Button>
              </Link>
            </motion.div>

            {/* Animation for pulse effect */}
            <div className="relative mt-16">
              <motion.div
                className="w-4 h-4 rounded-full bg-purple-600 dark:bg-purple-500 mx-auto"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(147, 51, 234, 0.4)', 
                    '0 0 0 20px rgba(147, 51, 234, 0)', 
                    '0 0 0 0 rgba(147, 51, 234, 0)'
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <Footer />
    </div>
  );
};

export default About;