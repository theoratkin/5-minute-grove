<div class="ambient-canopy" aria-hidden="true">
	<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
		<defs>
			<radialGradient id="dappled-light" cx="50%" cy="50%" r="50%">
				<stop offset="0%" stop-color="var(--color-sun)" stop-opacity="0.16" />
				<stop offset="68%" stop-color="var(--color-sun)" stop-opacity="0.08" />
				<stop offset="100%" stop-color="var(--color-sun)" stop-opacity="0" />
			</radialGradient>
			<radialGradient id="canopy-mass" cx="50%" cy="50%" r="50%">
				<stop offset="0%" stop-color="var(--color-moss)" stop-opacity="0.12" />
				<stop offset="72%" stop-color="var(--color-moss)" stop-opacity="0.08" />
				<stop offset="100%" stop-color="var(--color-moss)" stop-opacity="0" />
			</radialGradient>
		</defs>

		<!-- Warm, uneven light keeps the middle of the workspace feeling like a clearing. -->
		<g class="dappled-light">
			<ellipse cx="540" cy="120" rx="250" ry="135" />
			<ellipse cx="920" cy="350" rx="190" ry="235" />
			<ellipse cx="400" cy="690" rx="220" ry="160" />
		</g>

		<!-- Broad, soft canopy masses establish depth before the individual leaves. -->
		<g class="canopy-mass">
			<ellipse cx="-35" cy="80" rx="250" ry="190" />
			<ellipse cx="170" cy="-35" rx="270" ry="145" />
			<ellipse cx="1390" cy="85" rx="240" ry="190" />
			<ellipse cx="1250" cy="-40" rx="260" ry="145" />
			<ellipse cx="-70" cy="780" rx="195" ry="250" />
		</g>

		<!-- Organic edge detail, deliberately leaving the center calm and readable. -->
		<g class="leaves leaves-left">
			<ellipse cx="25" cy="110" rx="75" ry="30" transform="rotate(32 25 110)" />
			<ellipse cx="118" cy="54" rx="80" ry="33" transform="rotate(-18 118 54)" />
			<ellipse cx="212" cy="18" rx="72" ry="28" transform="rotate(18 212 18)" />
			<ellipse cx="45" cy="220" rx="70" ry="29" transform="rotate(-38 45 220)" />
			<ellipse cx="-4" cy="655" rx="82" ry="32" transform="rotate(-28 -4 655)" />
			<ellipse cx="62" cy="748" rx="78" ry="31" transform="rotate(37 62 748)" />
			<ellipse cx="14" cy="838" rx="88" ry="34" transform="rotate(-13 14 838)" />
		</g>
		<g class="leaves leaves-right">
			<ellipse cx="1415" cy="94" rx="78" ry="31" transform="rotate(-30 1415 94)" />
			<ellipse cx="1325" cy="47" rx="83" ry="32" transform="rotate(20 1325 47)" />
			<ellipse cx="1230" cy="14" rx="69" ry="27" transform="rotate(-18 1230 14)" />
			<ellipse cx="1392" cy="205" rx="72" ry="29" transform="rotate(36 1392 205)" />
		</g>
	</svg>
</div>

<style>
	.ambient-canopy {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
	}

	svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	.dappled-light {
		fill: url('#dappled-light');
	}

	.canopy-mass {
		fill: url('#canopy-mass');
	}

	.leaves {
		fill: var(--color-moss);
		opacity: 0.11;
	}

	.leaves-left ellipse:nth-child(even),
	.leaves-right ellipse:nth-child(odd) {
		fill: var(--color-sprout);
		opacity: 0.85;
	}

	@media (max-width: 640px) {
		.ambient-canopy { opacity: 0.78; }
	}
</style>
