import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title as="h3" className="text-xl font-bold text-hawaii-teal">
                      Weather Data Information
                    </Dialog.Title>
                    <button 
                      onClick={onClose}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-hawaii-teal rounded-full"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="prose dark:prose-invert max-w-none">
                    <h4 className="text-hawaii-blue font-medium">Data Sources</h4>
                    <p>
                      Climate data is sourced from multiple authoritative sources including NOAA, Hawaii Climate Data Portal, 
                      and Pacific Islands Ocean Observing System.
                    </p>
                    
                    <h4 className="text-hawaii-blue font-medium mt-4">Accuracy & Updates</h4>
                    <p>
                      Weather forecasts are updated every 6 hours. Historical climate data is validated against 
                      multiple sources for accuracy.
                    </p>
                    
                    <h4 className="text-hawaii-blue font-medium mt-4">Additional Resources</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><a href="#" className="text-hawaii-teal hover:underline">Hawaii Climate Change Portal</a></li>
                      <li><a href="#" className="text-hawaii-teal hover:underline">NOAA Climate Data</a></li>
                      <li><a href="#" className="text-hawaii-teal hover:underline">UH Sea Level Center</a></li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-700 px-5 py-3 rounded-b-xl">
                  <button
                    onClick={onClose}
                    className="bg-hawaii-green hover:bg-hawaii-teal text-white px-4 py-2 rounded-lg transition-colors w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hawaii-teal dark:focus:ring-offset-gray-800"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InfoModal; 