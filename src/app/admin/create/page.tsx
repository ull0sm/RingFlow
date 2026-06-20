"use client";
import React, { useState } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import { useRouter } from "next/navigation";
import { createTournament, CategoryInput } from "@/actions/tournament";

export default function EventCreationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const maxSteps = 3;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [ringCount, setRingCount] = useState(4);

  const [categories, setCategories] = useState<CategoryInput[]>([
    { name: "Men's Senior Elite", age_bracket: "18 - 35", weight_class: "-75kg", athletes_count: 12 }
  ]);

  const handleAddCategory = () => {
    setCategories([...categories, { name: "", age_bracket: "", weight_class: "", athletes_count: 0 }]);
  };

  const handleUpdateCategory = (index: number, field: keyof CategoryInput, value: string | number) => {
    const newCats = [...categories];
    newCats[index] = { ...newCats[index], [field]: value };
    setCategories(newCats);
  };

  const handleRemoveCategory = (index: number) => {
    const newCats = [...categories];
    newCats.splice(index, 1);
    setCategories(newCats);
  };

  const nextStep = async () => {
    if (currentStep < maxSteps) {
      if (currentStep === 1 && !name.trim()) {
        alert("Tournament Name is required");
        return;
      }
      setCurrentStep(currentStep + 1);
    } else {
      setIsSubmitting(true);
      try {
        const tournamentId = await createTournament({
          name,
          event_date: eventDate,
          venue,
          city,
          categories: categories.filter(c => c.name.trim() !== ""),
          ringCount
        });
        router.push(`/admin/event/${tournamentId}/dashboard`);
      } catch (err) {
        console.error(err);
        alert("Failed to create tournament. Make sure you are logged in.");
        setIsSubmitting(false);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      <AdminHeader title="Setup Wizard" />
      <div className="flex-1 overflow-y-auto p-margin-desktop bg-surface">
        <div className="max-w-[900px] mx-auto w-full">
          {/* Progress Tracker */}
          <nav className="mb-12">
            <ol className="flex items-center w-full">
              <li className={`flex w-full items-center ${currentStep >= 1 ? 'text-secondary after:border-secondary' : 'text-on-surface-variant after:border-outline-variant'} after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block`}>
                <span className={`flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0 ${currentStep >= 1 ? 'bg-secondary text-white' : 'bg-surface-container-highest'}`}>
                  <span className="material-symbols-outlined">info</span>
                </span>
              </li>
              <li className={`flex w-full items-center ${currentStep >= 2 ? 'text-secondary after:border-secondary' : 'text-on-surface-variant after:border-outline-variant'} after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block`}>
                <span className={`flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0 ${currentStep >= 2 ? 'bg-secondary text-white' : 'bg-surface-container-highest'}`}>
                  <span className="material-symbols-outlined">category</span>
                </span>
              </li>
              <li className={`flex items-center ${currentStep >= 3 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                <span className={`flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0 ${currentStep >= 3 ? 'bg-secondary text-white' : 'bg-surface-container-highest'}`}>
                  <span className="material-symbols-outlined">grid_view</span>
                </span>
              </li>
            </ol>
          </nav>

          {/* Wizard Content Canvas */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="p-8 flex-grow">
                <div className="mb-8">
                  <h1 className="font-headline-lg text-headline-lg mb-2">Tournament Fundamentals</h1>
                  <p className="font-body-md text-body-md text-on-surface-variant">Define the primary details for your event. This information will appear on official brackets and public displays.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-label-caps text-on-surface-variant">Tournament Name *</label>
                      <input value={name} onChange={e => setName(e.target.value)} className="w-full h-12 px-4 border border-outline-variant rounded focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md text-body-md bg-transparent" placeholder="e.g. 2024 Championship Finals" type="text" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-label-caps text-on-surface-variant">Event Date</label>
                      <input value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full h-12 px-4 border border-outline-variant rounded focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md text-body-md bg-transparent" type="date" />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-label-caps text-on-surface-variant">Venue Name</label>
                      <input value={venue} onChange={e => setVenue(e.target.value)} className="w-full h-12 px-4 border border-outline-variant rounded focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md text-body-md bg-transparent" placeholder="e.g. Olympic Arena" type="text" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-label-caps text-on-surface-variant">Location City</label>
                      <input value={city} onChange={e => setCity(e.target.value)} className="w-full h-12 px-4 border border-outline-variant rounded focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body-md text-body-md bg-transparent" placeholder="City, Country" type="text" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Categories */}
            {currentStep === 2 && (
              <div className="p-8 flex-grow">
                <div className="mb-8 flex justify-between items-end">
                  <div>
                    <h1 className="font-headline-lg text-headline-lg mb-2">Division Management</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant">Configure the age groups and weight classes for this competition.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleAddCategory} className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:opacity-90 rounded font-label-caps text-label-caps transition-opacity">
                      <span className="material-symbols-outlined text-[18px]">add</span> ADD NEW
                    </button>
                  </div>
                </div>
                <div className="overflow-hidden border border-outline-variant rounded">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low border-b border-outline-variant">
                      <tr>
                        <th className="px-4 py-4 font-label-caps text-label-caps text-on-surface-variant">Division Name</th>
                        <th className="px-4 py-4 font-label-caps text-label-caps text-on-surface-variant">Age Bracket</th>
                        <th className="px-4 py-4 font-label-caps text-label-caps text-on-surface-variant">Weight</th>
                        <th className="px-4 py-4 font-label-caps text-label-caps text-on-surface-variant w-24">Athletes</th>
                        <th className="px-4 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="font-body-sm text-body-sm divide-y divide-outline-variant">
                      {categories.map((cat, i) => (
                        <tr key={i} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-2"><input value={cat.name} onChange={e => handleUpdateCategory(i, 'name', e.target.value)} placeholder="e.g. Men's Elite" className="w-full p-2 border border-outline-variant rounded focus:outline-none focus:border-secondary" /></td>
                          <td className="px-4 py-2"><input value={cat.age_bracket} onChange={e => handleUpdateCategory(i, 'age_bracket', e.target.value)} placeholder="18-35" className="w-full p-2 border border-outline-variant rounded focus:outline-none focus:border-secondary" /></td>
                          <td className="px-4 py-2"><input value={cat.weight_class} onChange={e => handleUpdateCategory(i, 'weight_class', e.target.value)} placeholder="-75kg" className="w-full p-2 border border-outline-variant rounded focus:outline-none focus:border-secondary" /></td>
                          <td className="px-4 py-2"><input type="number" min="0" value={cat.athletes_count} onChange={e => handleUpdateCategory(i, 'athletes_count', parseInt(e.target.value) || 0)} className="w-full p-2 border border-outline-variant rounded focus:outline-none focus:border-secondary text-center" /></td>
                          <td className="px-4 py-2 text-right">
                            <button onClick={() => handleRemoveCategory(i)} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step 3: Ring Setup */}
            {currentStep === 3 && (
              <div className="p-8 flex-grow">
                <div className="mb-8">
                  <h1 className="font-headline-lg text-headline-lg mb-2">Arena Configuration</h1>
                  <p className="font-body-md text-body-md text-on-surface-variant">Designate the number of active rings.</p>
                </div>
                <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-6 p-6 bg-surface-container-low border border-outline-variant rounded">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-label-caps text-on-surface-variant">Total Mats / Rings</label>
                      <div className="flex items-center gap-3">
                        <button className="w-10 h-10 border border-outline rounded flex items-center justify-center hover:bg-surface-container-highest transition-colors" onClick={() => setRingCount(Math.max(1, ringCount - 1))}>-</button>
                        <input className="w-16 h-10 border border-outline rounded text-center font-bold text-headline-sm bg-transparent outline-none" type="number" value={ringCount} readOnly />
                        <button className="w-10 h-10 border border-outline rounded flex items-center justify-center hover:bg-surface-container-highest transition-colors" onClick={() => setRingCount(Math.min(12, ringCount + 1))}>+</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: ringCount }).map((_, i) => (
                      <div key={i} className="border border-outline-variant rounded p-5 bg-surface-container-lowest">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-label-caps text-label-caps text-secondary">RING {i + 1}</span>
                        </div>
                        <div className="space-y-3">
                          <div className="p-2 bg-surface-container rounded border border-outline-variant/30 text-xs font-medium text-on-surface-variant/50 italic text-center py-4">Will be created on finish</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="border-t border-outline-variant p-6 bg-surface-container-lowest flex justify-between items-center mt-auto">
              <button 
                className={`px-8 h-12 border border-outline-variant font-label-caps text-label-caps hover:bg-surface-container-low transition-colors ${currentStep === 1 || isSubmitting ? 'opacity-0 pointer-events-none' : ''}`} 
                onClick={prevStep}
              >
                BACK
              </button>
              <div className="flex gap-4">
                <button 
                  disabled={isSubmitting}
                  className="px-10 h-12 bg-primary text-white font-label-caps text-label-caps hover:opacity-90 transition-opacity disabled:opacity-50" 
                  onClick={nextStep}
                >
                  {isSubmitting ? "CREATING..." : currentStep === 3 ? "COMPLETE SETUP" : "NEXT STEP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
