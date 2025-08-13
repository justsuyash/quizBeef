import ContentSection from '../components/content-section'
import ProfileForm from './profile-form'
import SimpleProfileForm from './profile-form-simple'
import React from 'react'

function ProfileWrapper() {
  try {
    return <ProfileForm />
  } catch (error) {
    console.error('Profile form error:', error)
    return <SimpleProfileForm />
  }
}

export default function SettingsProfile() {
  return (
    <ContentSection
      title='Profile'
      desc='This is how others will see you on the site.'
    >
      <ProfileWrapper />
    </ContentSection>
  )
}
