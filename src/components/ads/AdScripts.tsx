import Script from 'next/script'

export function AdScripts() {
  return (
    <>
      {/* Adsterra - Popunder */}
      <Script
        src="https://pl29137815.profitablecpmratenetwork.com/02/22/df/0222dfeb445304f06b93cb6d5310eb61.js"
        strategy="lazyOnload"
      />
      {/* Adsterra - Social Bar */}
      <Script
        src="https://pl29137817.profitablecpmratenetwork.com/bd/e4/f8/bde4f8041afa557047d9474bf7d4cf08.js"
        strategy="lazyOnload"
      />
    </>
  )
}
