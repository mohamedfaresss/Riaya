import { Component, OnInit, OnDestroy, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
  isScrolled = false;
  mobileMenuOpen = false;
  currentYear = new Date().getFullYear();

  features = [
    {
      icon: 'calendar_month',
      title: 'Smart Appointment Flow',
      desc: 'Create, track, and manage bookings with minimal friction across your entire clinic.'
    },
    {
      icon: 'manage_accounts',
      title: 'Role-Based Workspaces',
      desc: 'Dedicated experiences for patients, doctors, and admins — everyone sees exactly what they need.'
    },
    {
      icon: 'schedule',
      title: 'Live Availability Management',
      desc: 'Instant slot visibility keeps scheduling accurate, conflict-free, and fast.'
    },
    {
      icon: 'sync',
      title: 'Booking Status Control',
      desc: 'Update booking states clearly across the full care flow — from pending to complete.'
    },
    {
      icon: 'bar_chart',
      title: 'Admin Operational Visibility',
      desc: 'Monitor users and bookings with actionable oversight and real-time clarity.'
    }
  ];

  steps = [
    { num: '01', title: 'Create your account', desc: 'Sign up in seconds. No complex setup required.' },
    { num: '02', title: 'Set doctor schedules', desc: 'Configure availability, slots, and working hours.' },
    { num: '03', title: 'Patients book slots', desc: 'Patients self-book from available time slots instantly.' },
    { num: '04', title: 'Teams manage visits', desc: 'Track, update, and complete appointments in one place.' }
  ];

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 40;
  }

  ngOnInit() {}
  ngAfterViewInit() {
    this.initIntersectionObserver();
  }
  ngOnDestroy() {}

  toggleMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMenu() {
    this.mobileMenuOpen = false;
  }

  private initIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }, 100);
  }
}