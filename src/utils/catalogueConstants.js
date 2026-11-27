// Official KTU 2024 Scheme Maximum Points Cap by Sub-Activity Item Code (Table 2 Regulations)
export const ITEM_MAX_POINTS = {
  // Group I (1.1 - 1.24) — Sports, Arts, Community Outreach, NSS/NCC & Union
  '1.1': 40,  // Sports/Games/Arts (Participation) - Max 40
  '1.2': 40,  // Sports/Games/Arts Winners Single - Max 40
  '1.3': 40,  // Sports/Games/Arts Winners Group - Max 40
  '1.4': 20,  // Publication in College Magazine - Max 20 (5 pts/yr)
  '1.5': 5,   // Four-Wheeler Driving License - Max 5
  '1.6': 10,  // Community Service 2 Days - Max 10
  '1.7': 10,  // Community Service 1 Week - Max 10
  '1.8': 10,  // Blood Donation - Max 10 (5 pts/donation)
  '1.9': 20,  // THRIVE Project - Max 20 (10 pts/sem)
  '1.10': 5,  // Tree Planting - Max 5
  '1.11': 30, // NSS Volunteer 2 years - Max 30
  '1.12': 20, // Leadership Camp 100 hrs - Max 20
  '1.13': 15, // State Level NSS Festival - Max 15
  '1.14': 15, // Special Service NSS/NCC - Max 15
  '1.15': 25, // State/National Awards - Max 25
  '1.16': 15, // National Camps - Max 15
  '1.17': 15, // 10 Days Volunteer 50 hrs - Max 15
  '1.18': 25, // RDC / IDC / International - Max 25
  '1.19': 40, // NCC Certificates - Max 40 (across NSS/NCC)
  '1.20': 10, // First Aid / Fire Safety - Max 10 (5 pts/training)
  '1.21': 10, // Swimming Certification - Max 10
  '1.22': 30, // College / University Union - Max 30
  '1.23': 10, // Magazine Editorial Board - Max 10 (5 pts/yr)
  '1.24': 10, // Hobby Clubs - Max 10 (5 pts/yr)

  // Group II (2.1 - 2.22) — Professional Self-Development & Technical
  '2.1': 40,  // Tech-Fest Participation - Max 40
  '2.2': 40,  // Tech-Fest Winners - Max 40
  '2.3': 40,  // Professional Society Participation - Max 40
  '2.4': 40,  // Professional Society Winners - Max 40
  '2.5': 15,  // Conferences/Workshops IIT/NIT - Max 15
  '2.6': 15,  // Poster Presentation - Max 15
  '2.7': 40,  // Paper Presentation IIT/NIT - Max 40
  '2.8': 40,  // Paper Presentation Winners - Max 40
  '2.9': 20,  // Paper Presentation Affiliated - Max 20
  '2.10': 20, // Paper Presentation Affiliated Winners - Max 20
  '2.11': 15, // Professional Society Membership - Max 15
  '2.12': 10, // Dept Student Association - Max 10
  '2.13': 10, // Class Representative - Max 10 (5 pts/yr)
  '2.14': 5,  // IV Coordinator - Max 5
  '2.15': 10, // Placement Cell - Max 10
  '2.16': 10, // IEDC Cell - Max 10
  '2.17': 10, // YIP Coordinator - Max 10
  '2.18': 20, // STRIDE - Max 20 (40 for project)
  '2.19': 20, // ICFOSS / FOSS Club - Max 20
  '2.20': 10, // Short-Term Internship - Max 10
  '2.21': 30, // English Proficiency (TOEFL/IELTS/PTE/BEC) - Max 30
  '2.22': 30, // Aptitude Proficiency (GRE/GATE/CAT/GMAT) - Max 30

  // Group III (3.1 - 3.17) — Innovation, Entrepreneurship, Hackathons & Internships
  '3.1': 20,  // IV Report - Max 20
  '3.2': 10,  // Best Project/Seminar - Max 10
  '3.3': 15,  // Long-Term Internship - Max 15
  '3.4': 30,  // LEAP IIT Madras - Max 30
  '3.5': 35,  // YIP (K-DISC) - Max 35
  '3.6': 35,  // STRIDE - Max 35
  '3.7': 35,  // GDC AI Workforce - Max 35
  '3.8': 25,  // ICFOSS Solution - Max 25
  '3.9': 40,  // Startup Registered - Max 40
  '3.10': 40, // Patents - Max 40
  '3.11': 40, // Prototype / Tech Adopted - Max 40
  '3.12': 40, // Venture Capital - Max 40
  '3.13': 40, // Societal Innovations - Max 40
  '3.14': 40, // Research Publications - Max 40
  '3.15': 40, // National Hackathons - Max 40
  '3.16': 40, // International Hackathons - Max 40
  '3.17': 40, // Skilling Courses - Max 40 (1 pt/hr)
};

/**
 * Format group title to avoid duplicated prefixes like "Group I — Group I — ..."
 */
export const formatGroupTitle = (group) => {
  if (!group) return '';
  const name = (group.name || '').trim();
  const code = (group.code || '').trim();

  // If already starts with "Group I" or "Group II" etc., don't re-prefix
  if (/^Group\s+[I|V|X\d]+/i.test(name)) {
    return name;
  }
  return code ? `Group ${code} — ${name}` : name;
};
