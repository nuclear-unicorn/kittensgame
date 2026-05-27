# Tech stack rules:

Only ES5
No build step
Strictly dojo 1.6 subset
Strictly vanilla js over jsx ($r helper method)

# Rendering/update loop

All dojo components follow Render and Update phase. Render creates dom structure within page container and stores all dom node references. Update updates dom attributes to avoid costly re-render.
Each render call unmounts and destroys entire rendered tree and re-creates it.

