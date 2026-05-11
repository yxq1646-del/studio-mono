<template>
  <div>
    <main>
      <HeroSection />
      <AboutSection />
      <WorkSection />
      <ServicesSection />
      <SkillsSection />
      <PhilosophySection />
    </main>
    <FooterSection />
    <MusicPlayer />
  </div>
</template>

<script setup>
import HeroSection from '@/components/HeroSection.vue'
import AboutSection from '@/components/AboutSection.vue'
import WorkSection from '@/components/WorkSection.vue'
import ServicesSection from '@/components/ServicesSection.vue'
import SkillsSection from '@/components/SkillsSection.vue'
import PhilosophySection from '@/components/PhilosophySection.vue'
import FooterSection from '@/components/FooterSection.vue'
import MusicPlayer from '@/components/MusicPlayer.vue'
</script>
