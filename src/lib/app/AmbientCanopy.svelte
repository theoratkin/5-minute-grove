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
			<g id="canopy-leaf">
				<path
					class="leaf-blade"
					d="M0 1 C18 -25 49 -35 84 -25 C78 8 49 33 0 1 Z"
				/>
			</g>
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

		<!-- Leafy stems frame the clearing without competing with the workspace. -->
		<g class="botanical botanical-left-top">
			<path class="branch" d="M-25 -18 C18 24 53 54 88 92 C111 117 136 140 176 163" />
			<path class="twig" d="M42 47 C45 29 48 13 55 -3 M78 82 C91 66 105 54 123 45 M111 117 C129 104 143 91 156 73 M139 142 C154 128 173 119 194 113" />
			<use href="#canopy-leaf" transform="translate(55 -3) rotate(-66) scale(1.17)" />
			<use href="#canopy-leaf" transform="translate(123 45) rotate(-27) scale(1.05)" />
			<use href="#canopy-leaf" transform="translate(156 73) rotate(-54) scale(1.12)" />
			<use href="#canopy-leaf" transform="translate(194 113) rotate(-16) scale(1.02)" />
			<use href="#canopy-leaf" transform="translate(176 163) rotate(29) scale(1.22)" />
		</g>

		<g class="botanical botanical-right-top" transform="translate(1440 185) scale(-1 1)">
			<path class="branch" d="M-28 -8 C15 13 43 45 74 70 C108 97 148 113 205 139" />
			<path class="twig" d="M28 28 C34 13 42 -1 56 -15 M66 63 C60 78 52 91 40 104 M99 89 C108 75 119 62 133 52 M141 110 C139 128 133 144 123 158 M171 124 C181 114 193 106 208 101" />
			<use href="#canopy-leaf" transform="translate(56 -15) rotate(-52) scale(1.08)" />
			<use href="#canopy-leaf" transform="translate(40 104) rotate(132) scale(.92)" />
			<use href="#canopy-leaf" transform="translate(133 52) rotate(-48) scale(1.02)" />
			<use href="#canopy-leaf" transform="translate(123 158) rotate(108) scale(.94)" />
			<use href="#canopy-leaf" transform="translate(208 101) rotate(-34) scale(1.06)" />
			<use href="#canopy-leaf" transform="translate(205 139) rotate(24) scale(1.16)" />
		</g>

		<g class="botanical botanical-left-bottom">
			<path class="branch" d="M-26 918 C14 868 33 818 48 774 C61 737 80 700 111 666" />
			<path class="twig" d="M12 866 C31 856 50 850 72 851 M35 813 C16 796 2 778 -8 756 M52 764 C73 751 93 745 116 747 M75 711 C61 691 54 672 51 651" />
			<use href="#canopy-leaf" transform="translate(72 851) rotate(3) scale(1.12)" />
			<use href="#canopy-leaf" transform="translate(-8 756) rotate(-114) scale(1.18)" />
			<use href="#canopy-leaf" transform="translate(116 747) rotate(5) scale(1.08)" />
			<use href="#canopy-leaf" transform="translate(51 651) rotate(-98) scale(1.16)" />
			<use href="#canopy-leaf" transform="translate(111 666) rotate(-48) scale(1.22)" />
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

	.botanical {
		color: var(--color-moss);
		opacity: 0.15;
	}

	.botanical-right-top {
		color: var(--color-moss);
		opacity: 0.15;
	}

	.branch,
	.twig {
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.branch { stroke-width: 8; }
	.twig { stroke-width: 4; }
	.leaf-blade { fill: currentColor; }

	@media (max-width: 640px) {
		.ambient-canopy { opacity: 0.78; }
	}
</style>
