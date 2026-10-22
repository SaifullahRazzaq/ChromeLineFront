import { Car, CarFront, FileCheck2, Paintbrush, Wrench, type LucideIcon } from 'lucide-react'

// Edit these to match the real workshop before launch
export const BUSINESS = {
  name: 'PrimeBody',
  tagline: 'Auto body & collision repair',
  phone: '+92 300 0000000',
  email: 'hello@primebody.example',
  address: '123 Workshop Road, Your City',
  hours: [
    ['Monday – Saturday', '9:00 am – 6:00 pm'],
    ['Sunday', 'Closed'],
  ] as [string, string][],
}

export interface Service {
  id: string
  title: string
  icon: LucideIcon
  short: string
  long: string
  points: string[]
  image: string
  position?: string
}

export const SERVICES: Service[] = [
  {
    id: 'auto-body-repair',
    image: '/images/dent-blue.jpg',
    title: 'Auto Body Repair',
    icon: Car,
    short: 'Dents, scratches, panels and bumpers restored to factory shape.',
    long: 'From a single door ding to a crumpled panel, our technicians reshape, replace and align body work so every gap and line sits the way the manufacturer intended.',
    points: ['Dent and panel repair', 'Bumper repair and replacement', 'Panel gap and alignment checks', 'Rust and corrosion treatment'],
  },
  {
    id: 'collision-repair',
    image: '/images/crash-silver.jpg',
    title: 'Collision Repair',
    icon: CarFront,
    short: 'Full structural and cosmetic repair after an accident.',
    long: 'After a crash your vehicle needs more than a cosmetic fix. We measure, pull and repair the structure first, then rebuild the bodywork on top of it.',
    points: ['Frame measuring and straightening', 'Structural and panel replacement', 'Safety system and sensor refit', 'Quality-control sign-off before delivery'],
  },
  {
    id: 'insurance-claim',
    image: '/images/crash-vw.jpg',
    title: 'Insurance Claim',
    icon: FileCheck2,
    short: 'We handle the paperwork and talk to your insurer for you.',
    long: 'Claims are stressful enough. We document the damage, prepare the estimate, coordinate approval with your insurer and keep you updated until you collect your car.',
    points: ['Damage documentation with photos', 'Estimate prepared for your insurer', 'Approval follow-up on your behalf', 'Supplement handling for hidden damage'],
  },
  {
    id: 'auto-paint-repair',
    image: '/images/paint-booth.jpg',
    title: 'Auto Paint Repair',
    icon: Paintbrush,
    short: 'Computer colour matching and a showroom-quality finish.',
    long: 'We match your paint code, blend it into surrounding panels and finish with a durable clear coat, so the repair disappears.',
    points: ['Paint-code colour matching', 'Spot, panel and full respray', 'Scratch and chip repair', 'Polish and clear-coat finish'],
  },
  {
    id: 'mechanical-repair',
    image: '/images/engine.jpg',
    title: 'Mechanical Repair',
    icon: Wrench,
    short: 'Suspension, steering, cooling and everything under the body.',
    long: 'Accidents often damage what you cannot see. We inspect and repair the mechanical side so the car is safe to drive, not just good to look at.',
    points: ['Suspension and steering repair', 'Radiator and cooling parts', 'Lights and electrical faults', 'Post-repair road test'],
  },
]

export const STEPS = [
  { title: 'Inspect', text: 'We check the vehicle, photograph every panel and record existing damage before a single tool is picked up.', image: '/images/crash-vw.jpg' },
  { title: 'Estimate', text: 'You get a clear, itemised estimate. If you are claiming, we coordinate approval with your insurer.', image: '/images/crash-silver.jpg' },
  { title: 'Repair', text: 'Technicians straighten, sand and rebuild the bodywork. Every task is timed and tracked.', image: '/images/hero-sanding.jpg' },
  { title: 'Paint & quality check', text: 'Colour-matched paint in a controlled booth, then a supervisor inspects the result. Anything below standard is reworked.', image: '/images/paint-booth.jpg' },
  { title: 'Delivery', text: 'Your car is polished, signed off and ready for pickup — looking like the accident never happened.', image: '/images/sports-red.jpg' },
]

export const GALLERY = [
  { image: '/images/shop-floor.jpg', title: 'Repair bays', text: 'Multiple vehicles in progress, each tracked from check-in to delivery.' },
  { image: '/images/hero-sanding.jpg', title: 'Panel preparation', text: 'Careful sanding and surface prep before any paint goes on.' },
  { image: '/images/paint-orange.jpg', title: 'Refinishing', text: 'Colour-matched coats applied with precision.', position: 'center 30%' },
  { image: '/images/polish-dark.jpg', title: 'Polish & finish', text: 'Machine polishing for a deep, even gloss.' },
  { image: '/images/lift.jpg', title: 'Under the body', text: 'Full underbody and mechanical inspection on the lift.', position: 'center 40%' },
  { image: '/images/mechanic.jpg', title: 'Mechanical work', text: 'Engine bay and mechanical faults diagnosed and repaired.' },
]

export const COMPARISONS = [
  { id: 'collision', label: 'Collision repair', before: '/images/crash-red.jpg', after: '/images/sports-red.jpg', beforeLabel: 'Collision damage', afterLabel: 'Restored & refinished' },
  { id: 'dent', label: 'Dent & paint', before: '/images/dent-blue.jpg', after: '/images/polish-blue.jpg', beforeLabel: 'Dents & peeling paint', afterLabel: 'Polished finish', beforePos: 'center 55%' },
]

export const PHOTO_CREDITS = 'Photos from Unsplash — Zoshua Colah, Clark Van Der Beken, Usman Malik, Iván Antonio, Luay Barani, Clarity Coat, Winston Chen, SL Autowerkes, Yuvraj Singh, Samuele Errico Piccarini, KC Shum, Dextar Studio and others.'
